import { useState } from 'react'
import { format } from 'date-fns'
import { Clock, AlertCircle, Sparkles, CheckCircle2, Search, X, CheckSquare, Square, Play } from 'lucide-react'
import { fetchTodayAssignments, updateAssignmentStatus } from '@/api/assignments'
import { AssignmentCard } from '@/components/AssignmentCard'
import { SchedulePanel } from '@/components/SchedulePanel'
import { sortAssignmentsByUrgency, getDayBoundary, getUrgencyLevel, cn } from '@/lib/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { NotificationBanner } from '@/components/NotificationBanner'
import { BurnoutWarning } from '@/components/BurnoutWarning'

export function Today() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'critical' | 'in_progress'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>([])

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

  const batchSubmitMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => updateAssignmentStatus(id, { status: 'Submitted' })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      setSelectedIds([])
    },
  })

  const batchInProgressMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map((id) => updateAssignmentStatus(id, { status: 'In progress' })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      setSelectedIds([])
    },
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPending.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredPending.map((a) => a.id))
    }
  }

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
    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchesClient = a.client_name?.toLowerCase().includes(q)
      const matchesCourse = a.course?.toLowerCase().includes(q)
      const matchesType   = a.assignment_type.toLowerCase().includes(q)
      const matchesNotes  = a.notes?.toLowerCase().includes(q)
      if (!matchesClient && !matchesCourse && !matchesType && !matchesNotes) {
        return false
      }
    }

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
      <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between transition-colors">
        <div>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
            <span>
              {isLoading
                ? 'Loading plan...'
                : isError
                ? 'Could not load assignments'
                : `${pending.length} assignment${pending.length !== 1 ? 's' : ''} pending`}
            </span>
            {!isLoading && !isError && totalEstHours > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/80 px-2 py-0.5 rounded-md">
                <Clock size={12} />
                {totalEstHours.toFixed(1)} hrs work est.
              </span>
            )}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
            Work day: {format(start, 'EEE d MMM (08:00')} – {format(end, '08:00)')}
          </p>
        </div>
        {!isLoading && !isError && pending.length > 0 && (
          <span className="text-[11px] font-bold bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-full">
            Active Shift
          </span>
        )}
      </div>
      
      <BurnoutWarning />
      <NotificationBanner />

      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:px-6 lg:pt-6">
        <section>
          <div className="px-4 pt-4 pb-2 space-y-2 lg:px-0 lg:pt-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Today's Assignments
              </h2>

              {/* Filter Pills */}
              {!isLoading && !isError && pending.length > 0 && (
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setFilter('all')}
                    className={cn(
                      'px-2 py-0.5 rounded-md transition-colors font-medium cursor-pointer',
                      filter === 'all'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    All ({pending.length})
                  </button>
                  <button
                    onClick={() => setFilter('critical')}
                    className={cn(
                      'px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer',
                      filter === 'critical'
                        ? 'bg-white dark:bg-gray-700 text-rose-700 dark:text-rose-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    <AlertCircle size={10} />
                    Urgent
                  </button>
                  <button
                    onClick={() => setFilter('in_progress')}
                    className={cn(
                      'px-2 py-0.5 rounded-md transition-colors font-medium flex items-center gap-1 cursor-pointer',
                      filter === 'in_progress'
                        ? 'bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-400 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    )}
                  >
                    In Progress
                  </button>
                </div>
              )}
            </div>

            {/* Live Search Input */}
            {!isLoading && !isError && (pending.length > 0 || searchQuery) && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by client, course, assignment type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-xs border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="px-4 space-y-3 lg:px-0">
            {/* Loading skeleton */}
            {isLoading &&
              [...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 dark:bg-gray-850 rounded-lg animate-pulse" />
              ))}

            {/* Error state */}
            {isError && (
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-5 text-center">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium mb-3">
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
              <div className="text-center py-10 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/40">
                <Sparkles size={28} className="mx-auto mb-2 text-emerald-500" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Nothing pending today</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Enjoy the breathing room</p>
              </div>
            )}

            {/* Filtered empty state */}
            {!isLoading && !isError && pending.length > 0 && filteredPending.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No assignments match this filter</p>
                <button
                  onClick={() => setFilter('all')}
                  className="mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold underline"
                >
                  Show all tasks
                </button>
              </div>
            )}

            {/* Assignment list */}
            {filteredPending.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                isSelected={selectedIds.includes(a.id)}
                onToggleSelect={() => toggleSelect(a.id)}
              />
            ))}

            {submitted.length > 0 && filter === 'all' && (
              <>
                <p className="text-xs text-gray-400 dark:text-gray-500 pt-2 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  Submitted Today ({submitted.length})
                </p>
                {submitted.map((a) => (
                  <AssignmentCard
                    key={a.id}
                    assignment={a}
                    isSelected={selectedIds.includes(a.id)}
                    onToggleSelect={() => toggleSelect(a.id)}
                  />
                ))}
              </>
            )}
          </div>
        </section>

        <section>
          <h2 className="px-4 pt-6 pb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider lg:px-0 lg:pt-0">
            Today's Schedule
          </h2>
          <div className="px-4 space-y-2 lg:px-0">
            <SchedulePanel />
          </div>
        </section>
      </div>

      {/* Floating Batch Actions Toolbar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 bg-gray-900/95 dark:bg-slate-900/95 text-white backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-gray-800 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-200 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-full cursor-pointer flex items-center gap-1"
              title="Toggle Select All"
            >
              <CheckSquare size={12} />
              {selectedIds.length}
            </button>
            <span className="text-xs font-medium hidden xs:inline">Selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              onClick={() => batchInProgressMutation.mutate(selectedIds)}
              disabled={batchInProgressMutation.isPending}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Play size={12} />
              <span>Start</span>
            </button>

            <button
              onClick={() => batchSubmitMutation.mutate(selectedIds)}
              disabled={batchSubmitMutation.isPending}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 size={13} />
              <span>Submit</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-gray-400 hover:text-white p-1 rounded-lg"
              title="Clear selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
