import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Lock, Fingerprint, KeyRound, Check, AlertCircle, Trash2 } from 'lucide-react'
import { PinKeypad } from '@/components/PinKeypad'
import { useLock } from '@/lib/lock-context'
import {
  isBiometricSupported,
  isBiometricEnabled,
  setBiometricEnabled,
} from '@/lib/security'

type Step = 'idle' | 'enter_old' | 'enter_new' | 'confirm_new'

export function SecuritySettingsShell() {
  const { isPinConfigured, enableLock, disableLock, changePin } = useLock()

  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricOn, setBiometricOn] = useState(false)

  const [step, setStep] = useState<Step>('idle')
  const [tempOldPin, setTempOldPin] = useState('')
  const [tempNewPin, setTempNewPin] = useState('')

  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [keypadError, setKeypadError] = useState(false)

  useEffect(() => {
    isBiometricSupported().then((supported) => setBiometricAvailable(supported))
    isBiometricEnabled().then((enabled) => setBiometricOn(enabled))
  }, [isPinConfigured])

  const handleStartSetup = () => {
    setErrorMessage(null)
    setSuccessMessage(null)
    setTempOldPin('')
    setTempNewPin('')
    setStep(isPinConfigured ? 'enter_old' : 'enter_new')
  }

  const handleOldPinComplete = (pin: string) => {
    setTempOldPin(pin)
    setErrorMessage(null)
    setStep('enter_new')
  }

  const handleNewPinComplete = (pin: string) => {
    setTempNewPin(pin)
    setErrorMessage(null)
    setStep('confirm_new')
  }

  const handleConfirmPinComplete = async (confirmPin: string) => {
    if (confirmPin !== tempNewPin) {
      setErrorMessage('PINs do not match. Try again.')
      setKeypadError(true)
      setTimeout(() => {
        setKeypadError(false)
        setStep('enter_new')
      }, 600)
      return
    }

    if (isPinConfigured) {
      const success = await changePin(tempOldPin, confirmPin)
      if (!success) {
        setErrorMessage('Current PIN is incorrect.')
        setKeypadError(true)
        setTimeout(() => setKeypadError(false), 500)
        setStep('enter_old')
        return
      }
    } else {
      await enableLock(confirmPin, biometricOn)
    }

    setStep('idle')
    setSuccessMessage('PIN saved successfully!')
    setErrorMessage(null)
    setTimeout(() => setSuccessMessage(null), 4000)
  }

  const handleDisable = async () => {
    if (window.confirm('Are you sure you want to disable PIN lock?')) {
      await disableLock()
      setBiometricOn(false)
      setStep('idle')
      setSuccessMessage('PIN lock has been disabled.')
      setTimeout(() => setSuccessMessage(null), 4000)
    }
  }

  const handleToggleBiometric = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked
    await setBiometricEnabled(enabled)
    setBiometricOn(enabled)
  }

  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/more"
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
          aria-label="Back to More"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            Security & PIN Lock
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Passcode entry and biometric authentication</p>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {step === 'idle' ? (
        <div className="space-y-4">
          {/* Lock Status Card */}
          <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${isPinConfigured ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                  <Lock size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {isPinConfigured ? 'PIN Lock Active' : 'PIN Lock Off'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isPinConfigured ? 'Your app is protected with a 4-digit PIN' : 'Add a passcode to secure Flowday'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={handleStartSetup}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <KeyRound size={14} />
                <span>{isPinConfigured ? 'Change PIN' : 'Set Up PIN'}</span>
              </button>

              {isPinConfigured && (
                <button
                  type="button"
                  onClick={handleDisable}
                  className="px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                  title="Disable PIN"
                >
                  <Trash2 size={14} />
                  <span>Disable</span>
                </button>
              )}
            </div>
          </div>

          {/* Biometrics Card */}
          {biometricAvailable && isPinConfigured && (
            <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400">
                  <Fingerprint size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Biometric Unlock</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Use Touch ID or Face ID on launch</p>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={biometricOn}
                  onChange={handleToggleBiometric}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs space-y-4">
          {step === 'enter_old' && (
            <PinKeypad
              title="Enter Current PIN"
              subtitle="Verify identity to update passcode"
              onComplete={handleOldPinComplete}
              error={keypadError}
            />
          )}

          {step === 'enter_new' && (
            <PinKeypad
              title="Enter New 4-Digit PIN"
              subtitle="Choose a secure PIN code"
              onComplete={handleNewPinComplete}
              error={keypadError}
            />
          )}

          {step === 'confirm_new' && (
            <PinKeypad
              title="Confirm New PIN"
              subtitle="Re-enter the new 4-digit PIN"
              onComplete={handleConfirmPinComplete}
              error={keypadError}
            />
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setStep('idle')}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
