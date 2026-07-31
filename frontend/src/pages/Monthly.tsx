import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchMonthlyAssignments } from '@/api/assignments'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isPast,
  isSameDay,
  addMonths,
  subMonths,
  parse,
} from 'date-fns'
import { cn } from '@/lib/utils'
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { AssignmentCard } from '@/components/AssignmentCard'
import type { WeekDay } from '@/types'

export function Monthly() {
  const [currentMonthStr, setCurrentMonthStr] = useState(() => format(new Date(), 'yyyy-MM'))
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignments', 'monthly', currentMonthStr],
    queryFn: () => fetchMonthlyAssignments(currentMonthStr),
  })

  const currentMonthDate = parse(currentMonthStr, 'yyyy-MM', new Date())
  const monthStart = startOfMonth(currentMonthDate)
  const monthEnd = endOfMonth(currentMonthDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const handlePrevMonth = () => {
    const prev = subMonths(currentMonthDate, 1)
    setCurrentMonthStr(format(prev, 'yyyy-MM'))
    setExpandedDay(null)
  }

  const handleNextMonth = () => {
    const next = addMonths(currentMonthDate, 1)
    setCurrentMonthStr(format(next, 'yyyy-MM'))
    setExpandedDay(null)
  }

  const days: WeekDay[] = daysInMonth.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayAssignments = assignments.filter((a) => {
      if (!isSameDay(new Date(a.deadline), date) || a.status === 'Cancelled') {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchesClient = a.client_name?.toLowerCase().includes(q)
        const matchesCourse = a.course?.toLowerCase().includes(q)
        const matchesType = a.assignment_type.toLowerCase().includes(q)
        const matchesNotes = a.notes?.toLowerCase().includes(q)
        return matchesClient || matchesCourse || matchesType || matchesNotes
      }
      return true
    })
    const pending = dayAssignments.filter((a) => a.status !== 'Submitted')
    const totalHours = pending.reduce(
      (sum, a) => sum + (a.estimated_hours ? parseFloat(a.estimated_hours) : 0),
      0
    )

    return {
      date: dateStr,
      label: format(date, 'EEE'),
      assignment_count: pending.length,
      estimated_hours: totalHours,
      is_overloaded: pending.length > 3 || totalHours > 9,
      is_today: isToday(date),
      is_past: isPast(date) && !isToday(date),
      assignments: dayAssignments,
    }
  })

  const totalAssignments = assignments.filter((a) => a.status !== 'Cancelled').length
  const submitted = assignments.filter((a) => a.status === 'Submitted').length
  const completedThisMonth = assignments.filter((a) => {
    if (a.status !== 'Submitted' || !a.submitted_at) return false
    const subDate = new Date(a.submitted_at)
    return subDate >= monthStart && subDate <= monthEnd
  }).length

  const pending = assignments.filter((a) => ['Not started', 'In progress'].includes(a.status)).length
  const overdue = assignments.filter((a) => a.status === 'Overdue').length
  const totalHours = assignments
    .filter((a) => a.status !== 'Submitted' && a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (a.estimated_hours ? parseFloat(a.estimated_hours) : 0), 0)

  const totalEarnings = assignments
    .filter((a) => a.status === 'Submitted' && !!a.paid_at)
    .reduce((sum, a) => sum + (a.payment_kes ? parseFloat(a.payment_kes) : 0), 0)

  const awaitingPayment = assignments
    .filter((a) => a.status === 'Submitted' && !!a.payment_kes && !a.paid_at)
    .reduce((sum, a) => sum + (a.payment_kes ? parseFloat(a.payment_kes) : 0), 0)

  return (
    <div className="pb-24 pt-2">
      {/* Navigation Header & Controls */}
      <div className="px-4 mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* Sub-nav view switcher */}
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

          {/* Month selector controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-2 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 px-1 min-w-[85px] text-center">
              {format(currentMonthDate, 'MMMM yyyy')}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Live Search Bar */}
        {!isLoading && !isError && (
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search monthly tasks..."
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
          [...Array(10)].map((_, i) => (
            <div key={`skel-monthly-${i}`} className="h-12 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
          ))}

        {/* Error state */}
        {isError && (
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-5 text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
              {(error as Error)?.message ?? 'Failed to load monthly assignments'}
            </p>
            <button
              onClick={() => refetch()}
              className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Day rows grid */}
        {!isLoading && !isError && (
          <div className="space-y-1.5">
            {days.map((day) => (
              <div key={day.date}>
                <button
                  onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all border cursor-pointer',
                    day.is_today && 'border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60',
                    day.is_past && !day.is_today && 'opacity-55 border-gray-100 dark:border-gray-800/80 bg-gray-50/80 dark:bg-gray-900/60',
                    !day.is_today && !day.is_past && 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900'
                  )}
                >
                  <div className="w-12 flex items-center gap-1 shrink-0">
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">{day.label}</span>
                    <span className={cn('text-sm font-bold', day.is_today ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200')}>
                      {format(new Date(day.date), 'd')}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          day.is_overloaded ? 'bg-red-400' : 'bg-emerald-400'
                        )}
                        style={{ width: `${Math.min((day.assignment_count / 5) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                        day.assignment_count === 0 && 'text-gray-400 dark:text-gray-500',
                        day.is_overloaded && 'bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400',
                        !day.is_overloaded && day.assignment_count > 0 && 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
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
                  <div className="mt-1.5 ml-4 space-y-2">
                    {day.assignments.map((a) => (
                      <AssignmentCard key={a.id} assignment={a} />
                    ))}
                  </div>
                )}

                {expandedDay === day.date && day.assignments.length === 0 && (
                  <div className="mt-1.5 ml-4 py-2.5 text-center text-xs text-gray-400 dark:text-gray-500">
                    Nothing scheduled for this day
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Summary Block */}
      {!isLoading && !isError && (
        <div className="mx-4 mt-6 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Monthly Summary — {format(currentMonthDate, 'MMMM yyyy')}
          </p>
          {[
            ['Total assignments in view', totalAssignments],
            ['Completed this month', completedThisMonth],
            ['Submitted (all-time)', submitted],
            ['Still pending', pending],
            ['Overdue', overdue],
            ['Total estimated hours', `${totalHours.toFixed(1)} hrs`],
            ['Paid earnings', `KES ${totalEarnings.toLocaleString()}`],
            ['Awaiting payment', `KES ${awaitingPayment.toLocaleString()}`],
          ].map(([label, value]) => (
            <div
              key={label as string}
              className={`flex justify-between text-sm ${
                label === 'Awaiting payment' && awaitingPayment > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : ''
              }`}
            >
              <span className="text-gray-600 dark:text-gray-400">{label}</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
