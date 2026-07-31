import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Check, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTenantSettings, updateTenantSettings } from '@/api/settings'

const REMINDER_OPTIONS = [
  { value: 15, label: '15 minutes before deadline' },
  { value: 30, label: '30 minutes before deadline' },
  { value: 60, label: '1 hour before deadline' },
  { value: 120, label: '2 hours before deadline (Default)' },
  { value: 240, label: '4 hours before deadline' },
  { value: 720, label: '12 hours before deadline' },
  { value: 1440, label: '24 hours before deadline' },
]

export function RemindersSettingsShell() {
  const queryClient = useQueryClient()
  const [reminderMinutes, setReminderMinutes] = useState(120)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenantSettings'],
    queryFn: fetchTenantSettings,
  })

  useEffect(() => {
    if (settings && settings.reminder_minutes_before !== undefined) {
      setReminderMinutes(settings.reminder_minutes_before)
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings'] })
      setSuccessMsg('Default reminder lead time updated!')
      setErrorMsg(null)
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err: Error) => {
      setErrorMsg(err.message || 'Failed to save reminder settings')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    mutation.mutate({
      reminder_minutes_before: reminderMinutes,
    })
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
            <Bell size={20} className="text-emerald-500" />
            Notification Reminders
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Configure default deadline notification lead times</p>
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-xs text-gray-400">Loading settings...</div>
      ) : (
        <form onSubmit={handleSubmit} className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-5 shadow-xs">
          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <Check size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Default Assignment Reminder Lead Time
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {REMINDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">New assignments will automatically inherit this alert lead time.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {mutation.isPending ? 'Saving Reminders...' : 'Save Reminder Defaults'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
