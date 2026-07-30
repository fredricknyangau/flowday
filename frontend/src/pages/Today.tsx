import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { fetchTodayAssignments } from '@/api/assignments'
import { AssignmentCard } from '@/components/AssignmentCard'
import { SchedulePanel } from '@/components/SchedulePanel'
import { sortAssignmentsByUrgency, getDayBoundary, getUrgencyLevel, cn } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { NotificationBanner } from '@/components/NotificationBanner'
import { BurnoutWarning } from '@/components/BurnoutWarning'

export function Today() {
  const [filter, setFilter] = useState<'all' | 'critical' | 'in_progress'>('all')

  const {
    data: assignments = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['assignments', 'today'],
    queryFn: fetchTodayAssignments,
    refetchInterval: 60_000,
  })

  const { start, end } = getDayBoundary()

  const sorted = sortAssignmentsByUrgency(
    assignments.filter((a) => a.status !== 'Cancelled'),
  )
  const pending   = sorted.filter((a) => a.status !== 'Submitted')
  const submitted = sorted.filter((a) => a.status === 'Submitted')

  const totalEstHours = pending.reduce(
    (sum, a) => sum + (a.estimated_hours ? parseFloat(a.estimated_hours) : 0),
    0
  )

  const filteredPending = pending.filter((a) => {
    if (filter === 'critical') {
      const level = getUrgencyLevel(a.deadline)
      return level === 'critical' || level === 'overdue'
    }
    if (filter === 'in_progress') {
      return a.status === 'In progress'
    }
    return true
  })

  return (
    <div className="pb-20">
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
        <div>
          <p className="text-sm text-emerald-800 font-semibold flex items-center gap-1.5">
            <span>
              {isLoading
                ? 'Loading plan...'
                : isError
                ? 'Could not load assignments'
                : `${pending.length} assignment${pending.length !== 1 ? 's' : ''} pending`}
            </span>
            {!isLoading && !isError && totalEstHours > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                <Clock size={12} />
                {totalEstHours.toFixed(1)} hrs work est.
              </span>
            )}
          </p>
          <p className="text-xs text-emerald-600 mt-0.5">
            Work day: {format(start, 'EEE d MMM (08:00')} – {format(end, '08:00)')}
          </p>
        </div>
        {!isLoading && !isError && pending.length > 0 && (
          <span className="text-[11px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
            Active Shift
          </span>
        )}
      </div>
      
      <BurnoutWarning />
      <NotificationBanner />

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-6 lg:pt-6">
        <section>
          <div className="px-4 pt-4 pb-2 flex items-center justify-between lg:px-0 lg:pt-0">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Today's Assignments
            </h2>

            {/* Filter Pills */}
            {!isLoading && !isError && pending.length > 0 && (
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'px-2 py-0.5 rounded-md transition-colors font-medium',
                    filter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  All ({pending.length})
                </button>
                <button
                  onClick={() => setFilter('critical')}
                  className={cn(
                    'px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1',
                    filter === 'critical' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  <AlertCircle size={10} />
                  Urgent
                </button>
                <button
                  onClick={() => setFilter('in_progress')}
                  className={cn(
                    'px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1',
                    filter === 'in_progress' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  In Progress
                </button>
              </div>
            )}
          </div>

          <div className="px-4 space-y-3 lg:px-0">
            {/* Loading skeleton */}
            {isLoading &&
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
              ))}

            {/* Error state */}
            {isError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-5 text-center">
                <p className="text-sm text-red-600 font-medium mb-3">
                  {(error as Error)?.message ?? 'Failed to load assignments'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="text-xs font-semibold text-white bg-red-500 hover:bg-red-600 px-4 py-1.5 rounded-full transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !isError && pending.length === 0 && (
              <div className="text-center py-10 text-gray-400 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Sparkles size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-gray-600">Nothing pending today</p>
                <p className="text-xs text-gray-400 mt-1">Enjoy the breathing room</p>
              </div>
            )}

            {/* Filtered empty state */}
            {!isLoading && !isError && pending.length > 0 && filteredPending.length === 0 && (
              <div className="text-center py-8 text-gray-400 bg-gray-50 border border-gray-100 rounded-lg">
                <p className="text-xs text-gray-500 font-medium">No assignments match this filter</p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-xs text-emerald-600 font-semibold underline"
                >
                  Show all tasks
                </button>
              </div>
            )}

            {/* Assignment list */}
            {filteredPending.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}

            {submitted.length > 0 && filter === 'all' && (
              <>
                <p className="text-xs text-gray-400 pt-2 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Submitted Today ({submitted.length})
                </p>
                {submitted.map((a) => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider lg:px-0 lg:pt-0">
            Today's Schedule
          </h2>
          <div className="px-4 space-y-2 lg:px-0">
            <SchedulePanel />
          </div>
        </section>
      </div>
    </div>
  )
}
