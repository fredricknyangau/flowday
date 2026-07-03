import { fetchTodayAssignments } from '@/api/assignments'
import { AssignmentCard } from '@/components/AssignmentCard'
import { SchedulePanel } from '@/components/SchedulePanel'
import { sortAssignmentsByUrgency } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'

export function Today() {
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

  const sorted = sortAssignmentsByUrgency(
    assignments.filter((a) => a.status !== 'Cancelled'),
  )
  const pending   = sorted.filter((a) => a.status !== 'Submitted')
  const submitted = sorted.filter((a) => a.status === 'Submitted')

  return (
    <div className="pb-20">
      <div className="px-4 py-3 bg-emerald-50 border-b border-emerald-100">
        <p className="text-sm text-emerald-700 font-medium">
          {isLoading
            ? 'Loading...'
            : isError
            ? 'Could not load assignments'
            : `${pending.length} assignment${pending.length !== 1 ? 's' : ''} pending today`}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-6 lg:pt-6">
        <section>
          <h2 className="px-4 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider lg:px-0 lg:pt-0">
            Today's Assignments
          </h2>
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
              <div className="text-center py-10 text-gray-400">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-sm font-medium text-gray-500">Nothing pending today</p>
                <p className="text-xs text-gray-400 mt-1">Enjoy the breathing room</p>
              </div>
            )}

            {/* Assignment list */}
            {pending.map((a) => (
              <AssignmentCard key={a.id} assignment={a} />
            ))}

            {submitted.length > 0 && (
              <>
                <p className="text-xs text-gray-400 pt-2 font-medium">Submitted</p>
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
