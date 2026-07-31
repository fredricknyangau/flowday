import { useQuery } from '@tanstack/react-query'
import { fetchAllAssignments } from '@/api/assignments'
import { format, startOfWeek, addDays, isToday, isPast, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AssignmentCard } from '@/components/AssignmentCard'
import type { WeekDay } from '@/types'

export function Weekly() {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignments', 'all'],
    queryFn: fetchAllAssignments,
  })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekEnd   = addDays(weekStart, 7)

  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date           = addDays(weekStart, i)
    const dateStr        = format(date, 'yyyy-MM-dd')
    const dayAssignments = assignments.filter((a) => {
      if (!isSameDay(new Date(a.deadline), date) || a.status === 'Cancelled') {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesClient = a.client_name?.toLowerCase().includes(q)
        const matchesCourse = a.course?.toLowerCase().includes(q)
        const matchesType   = a.assignment_type.toLowerCase().includes(q)
        const matchesNotes  = a.notes?.toLowerCase().includes(q)
        return matchesClient || matchesCourse || matchesType || matchesNotes
      }
      return true
    })
    const pending    = dayAssignments.filter((a) => a.status !== 'Submitted')
    const totalHours = pending.reduce(
      (sum, a) => sum + (a.estimated_hours ? parseFloat(a.estimated_hours) : 0),
      0,
    )

    return {
      date:             dateStr,
      label:            format(date, 'EEE'),
      assignment_count: pending.length,
      estimated_hours:  totalHours,
      is_overloaded:    pending.length > 3 || totalHours > 9,
      is_today:         isToday(date),
      is_past:          isPast(date) && !isToday(date),
      assignments:      dayAssignments,
    }
  })

  const totalAssignments  = assignments.filter((a) => a.status !== 'Cancelled').length
  const submitted         = assignments.filter((a) => a.status === 'Submitted').length
  const completedThisWeek = assignments.filter((a) => {
    if (a.status !== 'Submitted' || !a.submitted_at) return false
    const subDate = new Date(a.submitted_at)
    return subDate >= weekStart && subDate < weekEnd
  }).length

  const pending          = assignments.filter((a) => ['Not started', 'In progress'].includes(a.status)).length
  const overdue          = assignments.filter((a) => a.status === 'Overdue').length
  const totalHours       = assignments
    .filter((a) => a.status !== 'Submitted' && a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (a.estimated_hours ? parseFloat(a.estimated_hours) : 0), 0)
  const totalEarnings    = assignments
    .filter((a) => a.status === 'Submitted' && !!a.paid_at)
    .reduce((sum, a) => sum + (a.payment_kes ? parseFloat(a.payment_kes) : 0), 0)
  const awaitingPayment  = assignments
    .filter((a) => a.status === 'Submitted' && !!a.payment_kes && !a.paid_at)
    .reduce((sum, a) => sum + (a.payment_kes ? parseFloat(a.payment_kes) : 0), 0)

  return (
    <div className="pb-24 pt-2">
      {/* View Switcher & Date Header */}
      <div className="px-4 mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            <NavLink
              to="/weekly"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1 text-xs rounded-md font-semibold transition-colors',
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )
              }
            >
              Week
            </NavLink>
            <NavLink
              to="/monthly"
              className={({ isActive }) =>
                cn(
                  'px-2.5 py-1 text-xs rounded-md font-semibold transition-colors',
                  isActive
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                )
              }
            >
              Month
            </NavLink>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            {format(weekStart, 'd MMM')} – {format(addDays(weekStart, 6), 'd MMM yyyy')}
          </p>
        </div>

        {/* Live Search Bar */}
        {!isLoading && !isError && (
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search weekly tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1 text-xs border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="px-4 space-y-2">
        {isLoading &&
          [...Array(7)].map((_, i) => (
            <div key={`skel-weekly-${i}`} className="h-14 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}

        {/* Error state */}
        {isError && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-5 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
              {(error as Error)?.message ?? 'Failed to load weekly assignments'}
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Day rows */}
        {!isLoading && !isError && days.map((day) => (
          <div key={day.date}>
            <button
              onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all border cursor-pointer',
                day.is_today   && 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60',
                day.is_past    && !day.is_today && 'opacity-50 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900',
                !day.is_today  && !day.is_past  && 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900',
              )}
            >
              <div className="w-10 text-center shrink-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">{day.label}</p>
                <p className={cn('text-sm font-bold', day.is_today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200')}>
                  {format(new Date(day.date), 'd')}
                </p>
              </div>

              <div className="flex-1">
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      day.is_overloaded ? 'bg-red-400' : 'bg-emerald-400',
                    )}
                    style={{ width: `${Math.min((day.assignment_count / 5) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-right shrink-0">
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    day.assignment_count === 0 && 'text-gray-400 dark:text-gray-500',
                    day.is_overloaded          && 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
                    !day.is_overloaded && day.assignment_count > 0 && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300',
                  )}
                >
                  {day.assignment_count === 0
                    ? 'Clear'
                    : day.is_overloaded
                    ? `${day.assignment_count} OVERLOAD`
                    : `${day.assignment_count} tasks`}
                </span>
              </div>
            </button>

            {expandedDay === day.date && day.assignments.length > 0 && (
              <div className="mt-1 ml-4 space-y-2">
                {day.assignments.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            )}

            {expandedDay === day.date && day.assignments.length === 0 && (
              <div className="mt-1 ml-4 py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                Nothing scheduled for this day
              </div>
            )}
          </div>
        ))}
      </div>

      {!isLoading && !isError && (
        <div className="mx-4 mt-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Weekly Summary
          </p>
          {[
            ['Total assignments',     totalAssignments],
            ['Completed this week',   completedThisWeek],
            ['Submitted (all time)',  submitted],
            ['Still pending',         pending],
            ['Overdue',               overdue],
            ['Total estimated hours', `${totalHours.toFixed(1)} hrs`],
            ['Paid earnings',         `KES ${totalEarnings.toLocaleString()}`],
            ['Awaiting payment',      `KES ${awaitingPayment.toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label as string} className={`flex justify-between text-sm ${label === 'Awaiting payment' && awaitingPayment > 0 ? 'text-amber-600 dark:text-amber-400' : ''}`}>
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
