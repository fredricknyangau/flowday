import { useState, useEffect, useCallback } from 'react'
import { Delete } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  pinLength?: number
  onComplete: (pin: string) => void
  onPinChange?: (pin: string) => void
  error?: boolean
  title?: string
  subtitle?: string
  disabled?: boolean
}

export function PinKeypad({
  pinLength = 4,
  onComplete,
  onPinChange,
  error = false,
  title,
  subtitle,
  disabled = false,
}: Props) {
  const [pin, setPin] = useState('')

  const handleKeyPress = useCallback(
    (digit: string) => {
      if (disabled) return
      if (pin.length < pinLength) {
        const nextPin = pin + digit
        setPin(nextPin)
        onPinChange?.(nextPin)
        if (nextPin.length === pinLength) {
          onComplete(nextPin)
        }
      }
    },
    [pin, pinLength, onComplete, onPinChange, disabled]
  )

  const handleDelete = useCallback(() => {
    if (disabled) return
    if (pin.length > 0) {
      const nextPin = pin.slice(0, -1)
      setPin(nextPin)
      onPinChange?.(nextPin)
    }
  }, [pin, onPinChange, disabled])

  // Clear internal state if parent error changes
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setPin('')
        onPinChange?.('')
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [error, onPinChange])

  // Desktop physical keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleDelete()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyPress, handleDelete, disabled])

  return (
    <div className="flex flex-col items-center space-y-6 max-w-xs mx-auto text-center select-none">
      {title && <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>}
      {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-4">{subtitle}</p>}

      {/* PIN Dots Display Indicator */}
      <div
        className={cn(
          'flex items-center justify-center gap-4 py-2 transition-transform duration-200',
          error && 'animate-shake'
        )}
      >
        {Array.from({ length: pinLength }).map((_, i) => {
          const isFilled = i < pin.length
          return (
            <div
              key={i}
              className={cn(
                'w-4 h-4 rounded-full border-2 transition-all duration-150',
                isFilled
                  ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-xs'
                  : error
                  ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40'
                  : 'border-gray-300 dark:border-gray-700 bg-transparent'
              )}
            />
          )
        })}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-4 justify-items-center pt-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            disabled={disabled}
            onClick={() => handleKeyPress(num)}
            className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
          >
            {num}
          </button>
        ))}

        {/* Empty Spacer */}
        <div className="w-16 h-16 sm:w-18 sm:h-18" />

        {/* '0' Key */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleKeyPress('0')}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100 shadow-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-40"
        >
          0
        </button>

        {/* Delete Key */}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={handleDelete}
          className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-gray-50 dark:bg-gray-850 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer flex items-center justify-center disabled:opacity-20"
          aria-label="Delete"
        >
          <Delete size={22} />
        </button>
      </div>
    </div>
  )
}
