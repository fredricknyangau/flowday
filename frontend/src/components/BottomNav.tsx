import { NavLink } from 'react-router-dom'
import { CalendarDays, PlusCircle, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/',       label: 'Today',  Icon: CalendarDays },
  { to: '/add',    label: 'Add',    Icon: PlusCircle   },
  { to: '/weekly', label: 'Week',   Icon: LayoutGrid   },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-100">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-colors',
                isActive
                  ? 'text-emerald-600'
                  : 'text-gray-400 hover:text-gray-600'
              )
            }
          >
            <Icon size={22} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
