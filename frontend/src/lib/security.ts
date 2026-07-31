/**
 * NOTE: This PIN lock mechanism is a UX-level visual access gate for physical device privacy.
 * It does NOT encrypt cached offline data stored in IndexedDB or localStorage.
 * It gates the user interface against physical casual access without affecting JWT network authentication.
 */

const DB_NAME = 'flowday_security_db'
const DB_VERSION = 1
const STORE_NAME = 'security_store'

const FAILED_ATTEMPTS_KEY = 'flowday_failed_attempts'
const LOCKOUT_UNTIL_KEY = 'flowday_lockout_until'

function getDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result as T)
      req.onerror = () => reject(req.error)
    })
  } catch {
    const item = localStorage.getItem(`idb_fallback_${key}`)
    return item ? (JSON.parse(item) as T) : undefined
  }
}

export async function idbSet<T>(key: string, val: T): Promise<void> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.put(val, key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    localStorage.setItem(`idb_fallback_${key}`, JSON.stringify(val))
  }
}

export async function idbDel(key: string): Promise<void> {
  try {
    const db = await getDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const req = store.delete(key)
      req.onsuccess = () => resolve()
      req.onerror = () => reject(req.error)
    })
  } catch {
    localStorage.removeItem(`idb_fallback_${key}`)
  }
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function setPin(pin: string): Promise<void> {
  const hash = await hashPin(pin)
  await idbSet('pin_hash', hash)
  await idbSet('pin_enabled', true)
  resetFailedAttempts()
}

export async function verifyPin(pin: string): Promise<boolean> {
  const storedHash = await idbGet<string>('pin_hash')
  if (!storedHash) return false
  const inputHash = await hashPin(pin)
  return storedHash === inputHash
}

export async function disablePin(): Promise<void> {
  await idbDel('pin_hash')
  await idbSet('pin_enabled', false)
  await idbSet('biometric_enabled', false)
  resetFailedAttempts()
}

export async function isPinEnabled(): Promise<boolean> {
  const enabled = await idbGet<boolean>('pin_enabled')
  const hash = await idbGet<string>('pin_hash')
  return Boolean(enabled && hash)
}

export async function isBiometricSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      return false
    }
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    }
    return false
  } catch (err) {
    console.warn('Biometric detection check failed:', err)
    return false
  }
}

export async function isBiometricEnabled(): Promise<boolean> {
  const pinOn = await isPinEnabled()
  if (!pinOn) return false
  const bioOn = await idbGet<boolean>('biometric_enabled')
  return Boolean(bioOn)
}

export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await idbSet('biometric_enabled', enabled)
}

export async function isSetupPromptDismissed(): Promise<boolean> {
  const dismissed = await idbGet<boolean>('setup_prompt_dismissed')
  return Boolean(dismissed)
}

export async function setSetupPromptDismissed(dismissed: boolean): Promise<void> {
  await idbSet('setup_prompt_dismissed', dismissed)
}

// ── LOCKOUT & FAILURE COUNTER ──────────────────────────────────────────────

export function getFailedAttempts(): number {
  const val = sessionStorage.getItem(FAILED_ATTEMPTS_KEY)
  return val ? parseInt(val, 10) : 0
}

export function getLockoutRemainingSeconds(): number {
  const lockoutUntil = sessionStorage.getItem(LOCKOUT_UNTIL_KEY)
  if (!lockoutUntil) return 0
  const until = parseInt(lockoutUntil, 10)
  const now = Date.now()
  if (now >= until) {
    sessionStorage.removeItem(LOCKOUT_UNTIL_KEY)
    return 0
  }
  return Math.ceil((until - now) / 1000)
}

export function recordFailedAttempt(): { count: number; lockoutSeconds: number } {
  const current = getFailedAttempts() + 1
  sessionStorage.setItem(FAILED_ATTEMPTS_KEY, current.toString())

  if (current >= 5) {
    // 30-second lockout cooldown after 5 failed attempts
    const until = Date.now() + 30 * 1000
    sessionStorage.setItem(LOCKOUT_UNTIL_KEY, until.toString())
    return { count: current, lockoutSeconds: 30 }
  }

  return { count: current, lockoutSeconds: 0 }
}

export function resetFailedAttempts(): void {
  sessionStorage.removeItem(FAILED_ATTEMPTS_KEY)
  sessionStorage.removeItem(LOCKOUT_UNTIL_KEY)
}

export async function triggerBiometricAuth(): Promise<boolean> {
  if (!(await isBiometricSupported())) return false

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      },
    })

    return !!credential
  } catch (err) {
    console.warn('Biometric authentication failed or cancelled:', err)
    return false
  }
}
