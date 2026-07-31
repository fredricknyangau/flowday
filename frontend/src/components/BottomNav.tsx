import { NavLink, useLocation } from 'react-router-dom'
import { CalendarDays, PlusCircle, LayoutGrid, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/',         label: 'Today',    Icon: CalendarDays },
  { to: '/add',      label: 'Add',      Icon: PlusCircle   },
  { to: '/plan',     label: 'Plan',     Icon: LayoutGrid   },
  { to: '/contexts', label: 'Contexts', Icon: Users        },
  { to: '/more',     label: 'More',     Icon: MoreHorizontal },
]

export function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 transition-colors">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map(({ to, label, Icon }) => {
          const isActive =
            to === '/plan'
              ? ['/plan', '/weekly', '/monthly'].includes(pathname)
              : to === '/contexts'
              ? ['/contexts', '/clients'].includes(pathname)
              : to === '/more'
              ? pathname === '/more' || pathname.startsWith('/settings')
              : pathname === to

          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 flex-1 rounded-xl transition-colors min-w-0',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              )}
            >
              <Icon size={20} className="shrink-0" />
              <span className="text-[11px] leading-tight truncate">{label}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}


