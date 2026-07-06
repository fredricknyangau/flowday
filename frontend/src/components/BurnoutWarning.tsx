import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, X } from 'lucide-react'
import { fetchBurnoutStatus } from '@/api/burnout'

export function BurnoutWarning() {
  const [dismissed, setDismissed] = useState(false)

  const { data } = useQuery({
    queryKey: ['burnout'],
    queryFn: fetchBurnoutStatus,
    refetchInterval: 5 * 60_000,
  })

  useEffect(() => {
    const lastDismissed = localStorage.getItem('burnout_dismissed_at')
    if (lastDismissed) {
      const dismissedTime = new Date(lastDismissed).getTime()
      const now = new Date().getTime()
      // Hide if dismissed within the last 24 hours
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        setDismissed(true)
      } else {
        localStorage.removeItem('burnout_dismissed_at')
      }
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('burnout_dismissed_at', new Date().toISOString())
    setDismissed(true)
  }

  if (dismissed || !data?.is_at_risk) {
    return null
  }

  return (
    <div className="mx-4 mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl relative">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-rose-400 hover:text-rose-600 p-1"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
      <div className="flex items-start gap-3">
        <div className="bg-rose-100 p-2 rounded-full shrink-0">
          <AlertTriangle className="text-rose-600" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-rose-900">Take a breath</h3>
          <p className="text-xs text-rose-700 mt-1 pr-4">
            It looks like you're pushing hard. {data.trigger_signal} Consider resting or rescheduling non-urgent work to protect your energy.
          </p>
        </div>
      </div>
    </div>
  )
}
