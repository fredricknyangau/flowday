import { Link } from 'react-router-dom'
import { Clock, Bell, ShieldCheck, ChevronRight, Info, Sliders, LifeBuoy } from 'lucide-react'

const settingGroups = [
  {
    to: '/settings/schedule',
    title: 'Schedule & Capacity',
    description: 'Timezone, day boundary start/end times, and daily target capacity',
    icon: Clock,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400',
  },
  {
    to: '/settings/reminders',
    title: 'Notification Reminders',
    description: 'Default assignment lead-time alerts and push notification rules',
    icon: Bell,
    iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400',
  },
  {
    to: '/settings/security',
    title: 'Security & PIN Lock',
    description: 'App passcode lock, auto-lock timeout, and biometric options',
    icon: ShieldCheck,
    iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400',
  },
]

export function More() {
  return (
    <div className="pb-24 pt-4 px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">More</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Preferences, configuration, and app details</p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400">
          <Sliders size={20} />
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          Settings & Preferences
        </h2>

        <div className="space-y-2">
          {settingGroups.map(({ to, title, description, icon: Icon, iconBg }) => (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between p-3.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl hover:border-emerald-200 dark:hover:border-emerald-800/80 transition-all hover:shadow-xs group cursor-pointer"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{description}</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-gray-400 dark:text-gray-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 shrink-0 ml-2 transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
          System & Support
        </h2>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <Info size={16} className="text-emerald-500" />
              <span>Version</span>
            </div>
            <span className="font-semibold text-gray-500 dark:text-gray-400">Flowday v1.4.0</span>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 text-gray-600 dark:text-gray-300">
              <LifeBuoy size={16} className="text-blue-500" />
              <span>Principle</span>
            </div>
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">One answer per screen</span>
          </div>
        </div>
      </div>
    </div>
  )
}
