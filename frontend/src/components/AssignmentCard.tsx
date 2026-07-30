import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, FileText, Play, CheckCircle2, AlertCircle, Clock, RotateCcw } from 'lucide-react'
import { updateAssignmentStatus } from '@/api/assignments'
import { CountdownTimer } from './CountdownTimer'
import { getUrgencyLevel, getUrgencyClasses, getUrgencyBadgeClasses, cn } from '@/lib/utils'
import { ASSIGNMENT_STATUSES } from '@/lib/constants'
import type { Assignment, AssignmentStatus } from '@/types'

interface Props {
  assignment: Assignment
}

export function AssignmentCard({ assignment }: Props) {
  const queryClient = useQueryClient()
  const level       = getUrgencyLevel(assignment.deadline)
  const [isExpanded, setIsExpanded] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: (status: AssignmentStatus) =>
      updateAssignmentStatus(assignment.id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments', 'today'] })
      queryClient.invalidateQueries({ queryKey: ['assignments', 'all'] })
    },
  })

  const isSubmitted = assignment.status === 'Submitted'

  const renderUrgencyBadge = () => {
    switch (level) {
      case 'overdue':
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1', getUrgencyBadgeClasses(level))}>
            <AlertCircle size={11} /> Overdue
          </span>
        )
      case 'critical':
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1', getUrgencyBadgeClasses(level))}>
            <AlertCircle size={11} /> Critical (&lt;2h)
          </span>
        )
      case 'warning':
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1', getUrgencyBadgeClasses(level))}>
            <Clock size={11} /> Due Soon (&lt;6h)
          </span>
        )
      case 'safe':
      default:
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1', getUrgencyBadgeClasses(level))}>
            <CheckCircle2 size={11} /> On Track
          </span>
        )
    }
  }

  return (
    <div
      className={cn(
        'border-l-4 rounded-lg p-4 shadow-sm transition-opacity bg-white',
        getUrgencyClasses(level),
        isSubmitted && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {renderUrgencyBadge()}
            {assignment.client_priority && (
              <span
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider',
                  assignment.client_priority === 'High' ? 'bg-rose-100 text-rose-700' :
                  assignment.client_priority === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-600'
                )}
              >
                {assignment.client_priority} Priority
              </span>
            )}
          </div>

          <p className="font-semibold text-gray-800 truncate">
            {assignment.client_name ?? 'Unknown Client'}
            <span className="font-normal text-gray-500 ml-1">
              — {assignment.assignment_type}
            </span>
          </p>
          {assignment.course && (
            <p className="text-xs text-gray-500 mt-0.5">{assignment.course}</p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {assignment.word_count && (
              <span className="text-xs text-gray-500 font-medium">
                {assignment.word_count.toLocaleString()} words
              </span>
            )}
            {assignment.estimated_hours && (
              <span className="text-xs text-gray-500 font-medium">
                · {parseFloat(assignment.estimated_hours)} hrs est
              </span>
            )}
            {assignment.payment_kes && (
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                KES {parseFloat(assignment.payment_kes).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <CountdownTimer deadline={assignment.deadline} />
          {assignment.notes && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 font-medium transition-colors"
              title={isExpanded ? 'Hide notes' : 'Show notes'}
            >
              <FileText size={12} />
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && assignment.notes && (
        <div className="mt-3 p-2.5 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
          <span className="font-semibold text-gray-700 block mb-1">Notes:</span>
          {assignment.notes}
        </div>
      )}

      {/* Quick Action Buttons & Status Selector */}
      <div className="mt-3 flex items-center gap-2">
        {assignment.status === 'Not started' && (
          <button
            onClick={() => mutate('In progress')}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Play size={12} />
            Start Work
          </button>
        )}

        {assignment.status === 'In progress' && (
          <button
            onClick={() => mutate('Submitted')}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <CheckCircle2 size={12} />
            Submit Assignment
          </button>
        )}

        {assignment.status === 'Submitted' && (
          <button
            onClick={() => mutate('In progress')}
            disabled={isPending}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <RotateCcw size={12} />
            Reopen
          </button>
        )}

        <select
          value={assignment.status}
          onChange={(e) => mutate(e.target.value as AssignmentStatus)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          {ASSIGNMENT_STATUSES.filter(s => s !== 'Cancelled').map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
    </div>
  )
}
