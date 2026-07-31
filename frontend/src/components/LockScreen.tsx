import { useState, useEffect } from 'react'
import { Shield, Fingerprint, Lock } from 'lucide-react'
import { PinKeypad } from './PinKeypad'
import { useLock } from '@/lib/lock-context'
import {
  verifyPin,
  isBiometricEnabled,
  triggerBiometricAuth,
  recordFailedAttempt,
  getFailedAttempts,
  resetFailedAttempts,
  getLockoutRemainingSeconds,
} from '@/lib/security'

export function LockScreen() {
  const { unlockApp } = useLock()

  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [, setAttempts] = useState(() => getFailedAttempts())
  const [lockoutSecs, setLockoutSecs] = useState(() => getLockoutRemainingSeconds())
  const [isBioEnabled, setIsBioEnabled] = useState(false)

  // Check biometric state & trigger on mount if active
  useEffect(() => {
    let isMounted = true

    isBiometricEnabled().then((enabled) => {
      if (!isMounted) return
      setIsBioEnabled(enabled)

      if (enabled && getLockoutRemainingSeconds() === 0) {
        triggerBiometricAuth().then((success) => {
          if (isMounted && success) {
            handleSuccessUnlock()
          }
        })
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Lockout 30s countdown timer
  useEffect(() => {
    if (lockoutSecs > 0) {
      const timer = setInterval(() => {
        const rem = getLockoutRemainingSeconds()
        setLockoutSecs(rem)
        if (rem <= 0) {
          resetFailedAttempts()
          setAttempts(0)
          setErrorMessage(null)
        }
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockoutSecs])

  const handleSuccessUnlock = () => {
    resetFailedAttempts()
    unlockApp()
  }

  const handlePinComplete = async (pin: string) => {
    if (lockoutSecs > 0) return

    const isValid = await verifyPin(pin)
    if (isValid) {
      handleSuccessUnlock()
    } else {
      const result = recordFailedAttempt()
      setAttempts(result.count)
      setError(true)

      if (result.lockoutSeconds > 0) {
        setLockoutSecs(result.lockoutSeconds)
        setErrorMessage(`Too many failed attempts. Try again in ${result.lockoutSeconds}s.`)
      } else if (result.count >= 3) {
        const rem = 5 - result.count
        setErrorMessage(`Incorrect PIN. ${rem} attempt${rem > 1 ? 's' : ''} remaining.`)
      } else {
        setErrorMessage('Incorrect PIN')
      }

      setTimeout(() => setError(false), 500)
    }
  }

  const handleManualBiometric = async () => {
    if (lockoutSecs > 0) return
    const success = await triggerBiometricAuth()
    if (success) {
      handleSuccessUnlock()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
      {/* App Branding Header */}
      <div className="flex flex-col items-center mb-8 text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
          <Shield size={28} />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <span>Flowday</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700 flex items-center gap-1">
            <Lock size={10} /> Locked
          </span>
        </h1>
        <p className="text-xs text-gray-400">Enter your 4-digit PIN to access workspace</p>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs space-y-4">
        <PinKeypad
          pinLength={4}
          onComplete={handlePinComplete}
          error={error}
          disabled={lockoutSecs > 0}
        />

        {/* Error message / Lockout display */}
        {(errorMessage || lockoutSecs > 0) && (
          <div className="text-center pt-2">
            <p className="text-xs font-bold text-rose-400 bg-rose-950/60 border border-rose-900/60 py-1.5 px-3 rounded-xl inline-block">
              {lockoutSecs > 0 ? `Locked for ${lockoutSecs}s` : errorMessage}
            </p>
          </div>
        )}

        {/* Manual Biometric Button */}
        {isBioEnabled && lockoutSecs === 0 && (
          <div className="pt-4 text-center">
            <button
              onClick={handleManualBiometric}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs font-semibold text-emerald-400 hover:bg-gray-800 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <Fingerprint size={16} />
              <span>Unlock with Biometrics</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
