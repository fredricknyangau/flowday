import { useState, useEffect } from 'react'
import { Shield, Fingerprint, X, Lock } from 'lucide-react'
import { PinKeypad } from './PinKeypad'
import { useLock } from '@/lib/lock-context'
import { isBiometricSupported } from '@/lib/security'

export function FirstTimePinModal() {
  const { showFirstTimeSetup, enableLock, dismissFirstTimeSetup } = useLock()

  const [step, setStep] = useState<'prompt' | 'enter_pin' | 'confirm_pin'>('prompt')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [enableBiometrics, setEnableBiometrics] = useState(false)

  const [tempPin, setTempPin] = useState('')
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    isBiometricSupported().then((supported) => {
      setBiometricAvailable(supported)
      setEnableBiometrics(supported)
    })
  }, [])

  if (!showFirstTimeSetup) return null

  const handleStartSetup = () => {
    setStep('enter_pin')
  }

  const handlePinComplete = (pin: string) => {
    setTempPin(pin)
    setStep('confirm_pin')
  }

  const handleConfirmComplete = async (confirmPin: string) => {
    if (confirmPin !== tempPin) {
      setError(true)
      setErrorMsg('PINs do not match. Please try again.')
      setTimeout(() => {
        setError(false)
        setStep('enter_pin')
      }, 600)
    } else {
      await enableLock(confirmPin, enableBiometrics)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
        <button
          onClick={dismissFirstTimeSetup}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full"
          aria-label="Skip setup"
          title="Skip setup"
        >
          <X size={18} />
        </button>

        {step === 'prompt' && (
          <div className="text-center space-y-4 pt-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <Shield size={28} />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-gray-100">Protect Your Workspace</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Set a 4-digit PIN to secure Flowday on this device when inactive.
              </p>
            </div>

            {biometricAvailable && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <Fingerprint size={18} className="text-purple-500" />
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">Enable Touch/Face ID</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableBiometrics}
                  onChange={(e) => setEnableBiometrics(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                />
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={handleStartSetup}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Lock size={14} />
                <span>Set Up 4-Digit PIN</span>
              </button>

              <button
                onClick={dismissFirstTimeSetup}
                className="w-full py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                Skip for Now
              </button>
            </div>
          </div>
        )}

        {step === 'enter_pin' && (
          <div className="space-y-4">
            <PinKeypad
              title="Create a 4-Digit PIN"
              subtitle="Choose a passcode for this device"
              onComplete={handlePinComplete}
              error={error}
            />
            <div className="text-center pt-2">
              <button
                onClick={dismissFirstTimeSetup}
                className="text-xs font-semibold text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {step === 'confirm_pin' && (
          <div className="space-y-4">
            <PinKeypad
              title="Confirm Your PIN"
              subtitle="Re-enter your 4-digit passcode"
              onComplete={handleConfirmComplete}
              error={error}
            />
            {errorMsg && (
              <p className="text-xs font-bold text-rose-500 text-center">{errorMsg}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
