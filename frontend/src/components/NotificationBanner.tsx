import { Bell } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export function NotificationBanner() {
  const { permission, subscribe } = usePushNotifications()

  if (permission === 'granted' || permission === 'denied') {
    return null
  }

  return (
    <div className="mx-4 mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-3">
        <div className="bg-emerald-100 dark:bg-emerald-900/80 p-2 rounded-full">
          <Bell className="text-emerald-600 dark:text-emerald-300" size={20} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Never miss a deadline</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">Get notified 2 hours before assignments are due.</p>
        </div>
      </div>
      <button
        onClick={subscribe}
        className="px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors whitespace-nowrap cursor-pointer"
      >
        Enable Reminders
      </button>
    </div>
  )
}
