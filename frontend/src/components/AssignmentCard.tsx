import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAssignmentStatus } from '@/api/assignments'
import { CountdownTimer } from './CountdownTimer'
import { getUrgencyLevel, getUrgencyClasses, cn } from '@/lib/utils'
import { ASSIGNMENT_STATUSES } from '@/lib/constants'
import type { Assignment, AssignmentStatus } from '@/types'

interface Props {
  assignment: Assignment
}

export function AssignmentCard({ assignment }: Props) {
  const queryClient = useQueryClient()
  const level       = getUrgencyLevel(assignment.deadline)

  const { mutate } = useMutation({
    mutationFn: (status: AssignmentStatus) =>
      updateAssignmentStatus(assignment.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'today'] })
    },
  })

  const isSubmitted = assignment.status === 'Submitted'

  return (
    <div
      className={cn(
        'border-l-4 rounded-lg p-4 shadow-sm transition-opacity',
        getUrgencyClasses(level),
        isSubmitted && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 truncate">
            {assignment.client_name}
            <span className="font-normal text-gray-500 ml-1">
              — {assignment.assignment_type}
            </span>
          </p>
          {assignment.course && (
            <p className="text-xs text-gray-500 mt-0.5">{assignment.course}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {assignment.word_count && (
              <span className="text-xs text-gray-500">
                {assignment.word_count.toLocaleString()} words
              </span>
            )}
            {assignment.estimated_hours && (
              <span className="text-xs text-gray-500">
                · {parseFloat(assignment.estimated_hours)} hrs est
              </span>
            )}
          </div>
        </div>
        <CountdownTimer deadline={assignment.deadline} />
      </div>

      <div className="mt-3">
        <select
          value={assignment.status}
          onChange={(e) => mutate(e.target.value as AssignmentStatus)}
          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {ASSIGNMENT_STATUSES.filter(s => s !== 'Cancelled').map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
