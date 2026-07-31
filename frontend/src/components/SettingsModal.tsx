import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTenantSettings, updateTenantSettings } from '@/api/settings'
import { X, Clock, Globe, Check, AlertCircle, Gauge } from 'lucide-react'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const COMMON_TIMEZONES = [
  { value: 'Africa/Nairobi', label: 'Africa/Nairobi (UTC+3 - East Africa)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (US Eastern)' },
  { value: 'America/Chicago', label: 'America/Chicago (US Central)' },
  { value: 'America/Denver', label: 'America/Denver (US Mountain)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (US Pacific)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+4)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+8)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST - UTC+9)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
]

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const queryClient = useQueryClient()
  const [timezone, setTimezone] = useState('Africa/Nairobi')
  const [dayBoundaryHour, setDayBoundaryHour] = useState(8)
  const [dailyCapacityHours, setDailyCapacityHours] = useState(8)
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState(120)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['tenantSettings'],
    queryFn: fetchTenantSettings,
    enabled: isOpen,
  })

  useEffect(() => {
    if (settings) {
      setTimezone(settings.timezone)
      setDayBoundaryHour(settings.day_boundary_hour)
      setDailyCapacityHours(settings.daily_capacity_hours ?? 8)
      setReminderMinutesBefore(settings.reminder_minutes_before ?? 120)
    }
  }, [settings])

  const mutation = useMutation({
    mutationFn: updateTenantSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantSettings'] })
      queryClient.invalidateQueries({ queryKey: ['todayAssignments'] })
      queryClient.invalidateQueries({ queryKey: ['burnout'] })
      setSuccessMsg('Workspace settings saved successfully!')
      setErrorMsg(null)
      setTimeout(() => setSuccessMsg(null), 3000)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || err.message || 'Failed to update settings.'
      setErrorMsg(typeof msg === 'string' ? msg : JSON.stringify(msg))
      setSuccessMsg(null)
    },
  })

  if (!isOpen) return null

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    mutation.mutate({
      timezone,
      day_boundary_hour: dayBoundaryHour,
      daily_capacity_hours: dailyCapacityHours,
      reminder_minutes_before: reminderMinutesBefore,
    })
  }

  const getBoundaryDescription = (hour: number) => {
    if (hour === 0) return 'Standard midnight boundary (00:00 to 23:59). Best for standard 9-to-5 or day schedules.'
    if (hour === 8) return 'Overnight freelancer boundary (08:00 AM to 07:59 AM next day). Work completed before 08:00 AM counts toward yesterday.'
    if (hour === 19) return 'Night shift boundary (07:00 PM to 06:59 PM next day). Ideal for shift workers and nocturnal schedules.'
    const nextHour = (hour + 23) % 24
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `Custom boundary from ${pad(hour)}:00 to ${pad(nextHour)}:59 next day.`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Workspace Schedule Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-xl">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{successMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center text-sm text-gray-400 animate-pulse">
              Loading workspace settings...
            </div>
          ) : (
            <>
              {/* Timezone */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Primary Timezone (IANA)
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Select your primary operating timezone for date calculations.
                </p>
              </div>

              {/* Work Day Boundary Hour */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Work Day Start Boundary Hour
                </label>
                <select
                  value={dayBoundaryHour}
                  onChange={(e) => setDayBoundaryHour(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}:00 {i === 0 ? '(Midnight)' : i === 8 ? '(08:00 AM - Flowday Default)' : i === 19 ? '(07:00 PM - Night Shift)' : ''}
                    </option>
                  ))}
                </select>
                <div className="p-3 text-xs bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 rounded-xl text-emerald-900 dark:text-emerald-200">
                  {getBoundaryDescription(dayBoundaryHour)}
                </div>
              </div>

              {/* Daily Capacity Hours */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Daily Work Capacity Target (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={dailyCapacityHours}
                    onChange={(e) => setDailyCapacityHours(Math.max(0.5, Math.min(24, parseFloat(e.target.value) || 0)))}
                    className="w-32 px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    hours / day
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Flowday proactively warns you when today's planned estimated work hours exceed this capacity limit.
                </p>
              </div>
              {/* Reminder Lead Time */}
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <AlertCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Push Notification Lead Time (Minutes)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    step="5"
                    value={reminderMinutesBefore}
                    onChange={(e) => setReminderMinutesBefore(Math.max(5, Math.min(1440, parseInt(e.target.value) || 120)))}
                    className="w-24 px-3.5 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400">min before deadline</span>
                  <div className="flex items-center gap-1.5">
                    {[30, 60, 120, 240].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setReminderMinutesBefore(preset)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          reminderMinutesBefore === preset
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
                        }`}
                      >
                        {preset < 60 ? `${preset}m` : `${preset / 60}h`}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  How far in advance Flowday sends your push reminder. Individual assignments can override this default.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || isLoading}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-xl transition-all shadow-sm hover:shadow cursor-pointer disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

