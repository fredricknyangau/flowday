import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Clock, Check, AlertCircle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTenantSettings, updateTenantSettings } from '@/api/settings'

const POPULAR_TIMEZONES = [
  'Africa/Nairobi',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Dubai',
  'Asia/Singapore',
  'Australia/Sydney',
]

function isValidIanaTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch (e) {
    return false
  }
}

export function ScheduleSettingsShell() {
  const queryClient = useQueryClient()
  const [timezone, setTimezone] = useState('Africa/Nairobi')
  const [dayBoundaryHour, setDayBoundaryHour] = useState(8)
  const [dailyCapacityHours, setDailyCapacityHours] = useState(8.0)

  const [validationError, setValidationError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenantSettings'],
    queryFn: fetchTenantSettings,
  })

  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone || 'Africa/Nairobi')
      setDayBoundaryHour(settings.day_boundary_hour ?? 8)
      setDailyCapacityHours(settings.daily_capacity_hours ?? 8.0)
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings'] })
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      setSuccessMsg('Schedule & capacity settings saved successfully!')
      setValidationError(null)
      setTimeout(() => setSuccessMsg(null), 4000)
    },
    onError: (err: Error) => {
      setValidationError(err.message || 'Failed to save settings')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side instant timezone validation
    if (!isValidIanaTimezone(timezone.trim())) {
      setValidationError(`Invalid IANA Timezone '${timezone}'. Please select a valid timezone.`)
      return
    }

    if (dayBoundaryHour < 0 || dayBoundaryHour > 23) {
      setValidationError('Day boundary hour must be between 0 and 23.')
      return
    }

    if (dailyCapacityHours <= 0 || dailyCapacityHours > 24) {
      setValidationError('Daily capacity hours must be between 1 and 24.')
      return
    }

    setValidationError(null)
    mutation.mutate({
      timezone: timezone.trim(),
      day_boundary_hour: dayBoundaryHour,
      daily_capacity_hours: dailyCapacityHours,
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
            <Clock size={20} className="text-emerald-500" />
            Schedule & Capacity
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Configure timezone, day boundary, and capacity</p>
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

          {validationError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{validationError}</span>
            </div>
          )}

          {/* Timezone Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Primary Timezone (IANA)
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {POPULAR_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">Used for calculating shift boundaries and deadlines.</p>
          </div>

          {/* Day Boundary Hour */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Work Day Start Boundary (Hour 0–23)
            </label>
            <select
              value={dayBoundaryHour}
              onChange={(e) => setDayBoundaryHour(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {Array.from({ length: 24 }).map((_, h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:00 ({h === 0 ? 'Midnight' : h === 8 ? '8:00 AM Default' : `${h}:00`})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400">Tasks before this hour belong to the previous day's shift.</p>
          </div>

          {/* Daily Capacity Hours */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
              Target Daily Work Capacity (Hours)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="24"
              value={dailyCapacityHours}
              onChange={(e) => setDailyCapacityHours(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400">Triggers burnout indicators when scheduled work exceeds this capacity.</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {mutation.isPending ? 'Saving Settings...' : 'Save Schedule Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
