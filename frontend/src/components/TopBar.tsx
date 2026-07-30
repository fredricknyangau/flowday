import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth-context'
import { fetchProtectedStreak } from '@/api/burnout'
import { LogOut, Building2, Sun, Moon, Flame } from 'lucide-react'

export function TopBar() {
  const { user, logout, isAuthenticated } = useAuth()
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('flowday_theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const { data: streakData } = useQuery({
    queryKey: ['protectedStreak'],
    queryFn: fetchProtectedStreak,
    enabled: isAuthenticated,
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('flowday_theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('flowday_theme', 'light')
    }
  }, [isDark])

  const toggleTheme = () => setIsDark(!isDark)

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-2.5 flex items-center justify-between shadow-2xs transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
          Flowday
        </span>

        {isAuthenticated && user?.workspace_name && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 px-2.5 py-0.5 rounded-full max-w-[140px] sm:max-w-[200px] truncate">
            <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">{user.workspace_name}</span>
          </span>
        )}

        {isAuthenticated && streakData && streakData.streak_days > 0 && (
          <span
            title="Consecutive days without skipping protected reading, coding, or sleep blocks!"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 rounded-full"
          >
            <Flame className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0 animate-pulse" />
            <span>{streakData.streak_days}d Streak</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs text-gray-400 font-medium hidden sm:inline">
          {format(new Date(), 'EEE d MMM')}
        </span>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {isAuthenticated && (
          <button
            onClick={logout}
            title="Sign out of workspace"
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  )
}
