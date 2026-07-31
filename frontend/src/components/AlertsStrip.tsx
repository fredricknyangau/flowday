import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Bell, ChevronDown, ChevronUp, X } from 'lucide-react'
import { fetchBurnoutStatus } from '@/api/burnout'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function AlertsStrip() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [burnoutDismissed, setBurnoutDismissed] = useState(false)
  const [notifDismissed, setNotifDismissed] = useState(false)

  const { data: burnoutData } = useQuery({
    queryKey: ['burnout'],
    queryFn: fetchBurnoutStatus,
    refetchInterval: 5 * 60_000,
  })

  const { permission, subscribe } = usePushNotifications()

  useEffect(() => {
    const lastDismissed = localStorage.getItem('burnout_dismissed_at')
    if (lastDismissed) {
      const dismissedTime = new Date(lastDismissed).getTime()
      const now = new Date().getTime()
      if (now - dismissedTime < 24 * 60 * 60 * 1000) {
        setBurnoutDismissed(true)
      } else {
        localStorage.removeItem('burnout_dismissed_at')
      }
    }
  }, [])

  const handleDismissBurnout = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem('burnout_dismissed_at', new Date().toISOString())
    setBurnoutDismissed(true)
  }

  const handleDismissNotif = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifDismissed(true)
  }

  const showBurnout = !burnoutDismissed && !!burnoutData?.is_at_risk
  const showNotif = !notifDismissed && permission !== 'granted' && permission !== 'denied'

  if (!showBurnout && !showNotif) {
    return null
  }

  const activeCount = (showBurnout ? 1 : 0) + (showNotif ? 1 : 0)

  const getSummaryLabel = () => {
    if (showBurnout && showNotif) {
      return '2 Alerts: Burnout risk detected & Reminders disabled'
    }
    if (showBurnout) {
      return 'Burnout Risk: High workload detected'
    }
    return 'Reminder Notice: Enable deadline notifications'
  }

  return (
    <div className="mx-4 mt-3 rounded-2xl border transition-all overflow-hidden bg-white dark:bg-gray-900 border-amber-200/80 dark:border-amber-900/60 shadow-xs">
      {/* Single-line collapsed strip */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer bg-gradient-to-r from-amber-50/90 via-orange-50/50 to-amber-50/90 dark:from-amber-950/40 dark:via-gray-900 dark:to-amber-950/40 hover:opacity-95 transition-all"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 shrink-0">
            {showBurnout ? <AlertTriangle size={13} /> : <Bell size={13} />}
          </div>

          <span className="text-xs font-semibold text-amber-950 dark:text-amber-200 truncate">
            {getSummaryLabel()}
          </span>

          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 shrink-0">
            {activeCount}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'View'}</span>
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded Alert Details Drawer */}
      {isExpanded && (
        <div className="p-3.5 space-y-3 border-t border-amber-100 dark:border-amber-900/40 bg-gray-50/50 dark:bg-gray-900/80 animate-in slide-in-from-top-1 duration-150">
          {showBurnout && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-900/60 rounded-xl relative">
              <button
                onClick={handleDismissBurnout}
                className="absolute top-2.5 right-2.5 text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-1"
                aria-label="Dismiss burnout warning"
                title="Dismiss for 24 hours"
              >
                <X size={14} />
              </button>
              <div className="flex items-start gap-2.5 pr-6">
                <div className="p-1.5 bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 rounded-lg shrink-0">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">Take a breath</h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                    It looks like you're pushing hard. {burnoutData?.trigger_signal} Consider resting or rescheduling non-urgent work.
                  </p>
                </div>
              </div>
            </div>
          )}

          {showNotif && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl relative flex items-center justify-between gap-3">
              <button
                onClick={handleDismissNotif}
                className="absolute top-2.5 right-2.5 text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-300 p-1"
                aria-label="Dismiss notification reminder"
                title="Dismiss reminder"
              >
                <X size={14} />
              </button>
              <div className="flex items-center gap-2.5 pr-6 min-w-0">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 rounded-lg shrink-0">
                  <Bell size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Never miss a deadline</h4>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Get notified 2 hours before assignments are due.</p>
                </div>
              </div>
              <button
                onClick={subscribe}
                className="px-3 py-1.5 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors shrink-0 cursor-pointer"
              >
                Enable
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
