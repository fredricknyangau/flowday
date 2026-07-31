import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  isPinEnabled,
  setPin,
  disablePin,
  verifyPin,
  setBiometricEnabled,
  isSetupPromptDismissed,
  setSetupPromptDismissed,
} from './security'

interface LockContextType {
  isLocked: boolean
  isPinConfigured: boolean
  showFirstTimeSetup: boolean
  lockApp: () => void
  unlockApp: () => void
  enableLock: (pin: string, enableBiometrics?: boolean) => Promise<void>
  disableLock: () => Promise<void>
  changePin: (oldPin: string, newPin: string) => Promise<boolean>
  dismissFirstTimeSetup: () => Promise<void>
  reloadSecurityState: () => Promise<void>
}

const LockContext = createContext<LockContextType | undefined>(undefined)

const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function LockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false)
  const [isPinConfigured, setIsPinConfigured] = useState(false)
  const [showFirstTimeSetup, setShowFirstTimeSetup] = useState(false)

  const reloadSecurityState = useCallback(async () => {
    const enabled = await isPinEnabled()
    setIsPinConfigured(enabled)

    if (enabled) {
      const sessionUnlocked = sessionStorage.getItem('flowday_unlocked') === 'true'
      setIsLocked(!sessionUnlocked)
      setShowFirstTimeSetup(false)
    } else {
      setIsLocked(false)
      const dismissed = await isSetupPromptDismissed()
      setShowFirstTimeSetup(!dismissed)
    }
  }, [])

  useEffect(() => {
    reloadSecurityState()
  }, [reloadSecurityState])

  const lockApp = useCallback(() => {
    if (isPinConfigured) {
      sessionStorage.removeItem('flowday_unlocked')
      setIsLocked(true)
    }
  }, [isPinConfigured])

  const unlockApp = useCallback(() => {
    sessionStorage.setItem('flowday_unlocked', 'true')
    setIsLocked(false)
  }, [])

  const enableLock = useCallback(
    async (pin: string, enableBiometrics: boolean = false) => {
      await setPin(pin)
      if (enableBiometrics) {
        await setBiometricEnabled(true)
      }
      await reloadSecurityState()
      sessionStorage.setItem('flowday_unlocked', 'true')
      setIsLocked(false)
    },
    [reloadSecurityState]
  )

  const disableLock = useCallback(async () => {
    await disablePin()
    await reloadSecurityState()
    setIsLocked(false)
  }, [reloadSecurityState])

  const changePin = useCallback(
    async (oldPin: string, newPin: string): Promise<boolean> => {
      const isValid = await verifyPin(oldPin)
      if (!isValid) return false
      await setPin(newPin)
      await reloadSecurityState()
      return true
    },
    [reloadSecurityState]
  )

  const dismissFirstTimeSetup = useCallback(async () => {
    await setSetupPromptDismissed(true)
    setShowFirstTimeSetup(false)
  }, [])

  // 1. Immediate Re-lock on App Backgrounding (visibilitychange to hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && isPinConfigured) {
        lockApp()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isPinConfigured, lockApp])

  // 2. 5-Minute Inactivity Auto-Lock
  useEffect(() => {
    if (!isPinConfigured || isLocked) return

    let timer: ReturnType<typeof setTimeout>

    const resetTimer = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        lockApp()
      }, INACTIVITY_TIMEOUT_MS)
    }

    const activityEvents = ['mousemove', 'keydown', 'touchstart', 'pointerdown', 'scroll']
    activityEvents.forEach((event) => window.addEventListener(event, resetTimer))

    resetTimer()

    return () => {
      clearTimeout(timer)
      activityEvents.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [isPinConfigured, isLocked, lockApp])

  return (
    <LockContext.Provider
      value={{
        isLocked,
        isPinConfigured,
        showFirstTimeSetup,
        lockApp,
        unlockApp,
        enableLock,
        disableLock,
        changePin,
        dismissFirstTimeSetup,
        reloadSecurityState,
      }}
    >
      {children}
    </LockContext.Provider>
  )
}

export function useLock() {
  const context = useContext(LockContext)
  if (!context) {
    throw new Error('useLock must be used within a LockProvider')
  }
  return context
}
