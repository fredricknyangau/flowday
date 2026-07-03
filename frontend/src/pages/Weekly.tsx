import { useQuery } from '@tanstack/react-query'
import { fetchAllAssignments } from '@/api/assignments'
import { format, startOfWeek, addDays, isToday, isPast, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { AssignmentCard } from '@/components/AssignmentCard'
import type { WeekDay } from '@/types'

export function Weekly() {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const { data: assignments = [], isLoading } = useQuery({
    queryKey: ['assignments', 'all'],
    queryFn: fetchAllAssignments,
  })

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })

  const days: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date       = addDays(weekStart, i)
    const dateStr    = format(date, 'yyyy-MM-dd')
    const dayAssignments = assignments.filter(
      (a) =>
        isSameDay(new Date(a.deadline), date) &&
        a.status !== 'Cancelled'
    )
    const pending    = dayAssignments.filter(a => a.status !== 'Submitted')
    const totalHours = pending.reduce((sum, a) => sum + (a.estimated_hours ?? 0), 0)

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

  const totalAssignments = assignments.filter(a => a.status !== 'Cancelled').length
  const submitted        = assignments.filter(a => a.status === 'Submitted').length
  const pending          = assignments.filter(a => ['Not started', 'In progress'].includes(a.status)).length
  const overdue          = assignments.filter(a => a.status === 'Overdue').length
  const totalHours       = assignments
    .filter(a => a.status !== 'Submitted' && a.status !== 'Cancelled')
    .reduce((sum, a) => sum + (a.estimated_hours ?? 0), 0)
  const totalEarnings    = assignments
    .filter(a => a.status === 'Submitted')
    .reduce((sum, a) => sum + (a.payment_kes ?? 0), 0)

  return (
    <div className="pb-24 pt-2">
      <div className="px-4 mb-1">
        <p className="text-xs text-gray-500">
          {format(weekStart, 'd MMM')} to {format(addDays(weekStart, 6), 'd MMM yyyy')}
        </p>
      </div>

      <div className="px-4 space-y-2">
        {isLoading && [...Array(7)].map((_, i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        ))}

        {days.map((day) => (
          <div key={day.date}>
            <button
              onClick={() => setExpandedDay(expandedDay === day.date ? null : day.date)}
              className={cn(
                'w-full flex items-center gap-3 rounded-lg px-3 py-3 text-left transition-all border',
                day.is_today    && 'border-blue-300 bg-blue-50',
                day.is_past     && !day.is_today && 'opacity-50 border-gray-100 bg-gray-50',
                !day.is_today   && !day.is_past  && 'border-gray-100 bg-white',
              )}
            >
              <div className="w-10 text-center shrink-0">
                <p className="text-xs text-gray-500">{day.label}</p>
                <p className={cn(
                  'text-sm font-bold',
                  day.is_today ? 'text-blue-600' : 'text-gray-700'
                )}>
                  {format(new Date(day.date), 'd')}
                </p>
              </div>

              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
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
                <span className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  day.assignment_count === 0 && 'text-gray-400',
                  day.is_overloaded          && 'bg-red-100 text-red-600',
                  !day.is_overloaded && day.assignment_count > 0 && 'bg-emerald-100 text-emerald-700',
                )}>
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
          </div>
        ))}
      </div>

      <div className="mx-4 mt-6 rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Weekly Summary
        </p>
        {[
          ['Total assignments',      totalAssignments],
          ['Submitted',              submitted],
          ['Still pending',          pending],
          ['Overdue',                overdue],
          ['Total estimated hours',  `${totalHours} hrs`],
          ['Earnings this week',     `KES ${totalEarnings.toLocaleString()}`],
        ].map(([label, value]) => (
          <div key={label as string} className="flex justify-between text-sm">
            <span className="text-gray-600">{label}</span>
            <span className="font-semibold text-gray-800">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
