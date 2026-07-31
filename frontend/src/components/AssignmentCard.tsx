import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  RotateCcw,
  Edit2,
  Banknote,
  BookOpen,
  User,
  Briefcase,
  Layers,
} from 'lucide-react'
import { updateAssignmentStatus, markAssignmentPaid } from '@/api/assignments'
import { CountdownTimer } from './CountdownTimer'
import { EditAssignmentModal } from './EditAssignmentModal'
import { SubtasksChecklist } from './SubtasksChecklist'
import { getUrgencyLevel, getUrgencyClasses, getUrgencyBadgeClasses, cn } from '@/lib/utils'
import { ASSIGNMENT_STATUSES } from '@/lib/constants'
import type { Assignment, AssignmentStatus, ContextType } from '@/types'
import { useCountdown } from '@/hooks/useCountdown'

interface Props {
  assignment: Assignment
  isSelectable?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

function getContextPrefix(type?: ContextType): string {
  switch (type) {
    case 'Academic':
      return 'Course'
    case 'Employer':
      return 'Employer'
    case 'Client':
      return 'Client'
    case 'Personal':
      return 'Personal'
    default:
      return 'Context'
  }
}

function getContextIcon(type?: ContextType) {
  switch (type) {
    case 'Academic':
      return BookOpen
    case 'Employer':
      return Briefcase
    case 'Client':
      return User
    case 'Personal':
      return Layers
    default:
      return Layers
  }
}

export function AssignmentCard({ assignment, isSelected, onToggleSelect }: Props) {
  const queryClient = useQueryClient()
  const level = getUrgencyLevel(assignment.deadline)
  const { overdueDisplay } = useCountdown(assignment.deadline)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationKey: ['updateAssignmentStatus'],
    mutationFn: ({ id, status }: { id: string; status: AssignmentStatus }) =>
      updateAssignmentStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['burnout'] })
    },
  })

  const { mutate: mutatePaid, isPending: isPaidPending } = useMutation({
    mutationKey: ['markAssignmentPaid', assignment.id],
    mutationFn: () => markAssignmentPaid(assignment.id, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      queryClient.invalidateQueries({ queryKey: ['contexts'] })
      queryClient.invalidateQueries({ queryKey: ['contextAnalytics'] })
    },
  })

  const isSubmitted = assignment.status === 'Submitted'
  const isUnpaid = isSubmitted && !!assignment.payment_kes && !assignment.paid_at

  const handleStatusChange = (newStatus: AssignmentStatus) => {
    mutate({ id: assignment.id, status: newStatus })
  }

  const contextType = assignment.context_type
  const contextName = assignment.context_name ?? assignment.client_name ?? 'Unknown Context'
  const contextPrefix = getContextPrefix(contextType)
  const ContextIcon = getContextIcon(contextType)

  const renderUrgencyBadge = () => {
    switch (level) {
      case 'overdue':
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ring-1 ring-rose-400/50 animate-pulse', getUrgencyBadgeClasses(level))}>
            <AlertCircle size={11} className="animate-spin" /> {overdueDisplay}
          </span>
        )
      case 'critical':
        return (
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ring-1 ring-rose-400/50 animate-pulse', getUrgencyBadgeClasses(level))}>
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

  const renderPrimaryAction = () => {
    if (assignment.status === 'Not started') {
      return (
        <button
          onClick={() => handleStatusChange('In progress')}
          disabled={isPending}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
        >
          <Play size={12} />
          <span>Start</span>
        </button>
      )
    }
    if (assignment.status === 'In progress' || assignment.status === 'Overdue') {
      return (
        <button
          onClick={() => handleStatusChange('Submitted')}
          disabled={isPending}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
        >
          <CheckCircle2 size={12} />
          <span>Submit</span>
        </button>
      )
    }
    if (isUnpaid) {
      return (
        <button
          onClick={() => mutatePaid()}
          disabled={isPaidPending}
          className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-2xs"
        >
          <Banknote size={12} />
          <span>Mark Paid</span>
        </button>
      )
    }
    if (isSubmitted) {
      return (
        <button
          onClick={() => handleStatusChange('In progress')}
          disabled={isPending}
          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-xl transition-colors shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1"
        >
          <RotateCcw size={12} />
          <span>Reopen</span>
        </button>
      )
    }
    return null
  }

  return (
    <>
      <div
        className={cn(
          'border-l-4 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all duration-200 bg-white dark:bg-gray-900 border border-gray-100/80 dark:border-gray-800/80 relative space-y-2',
          getUrgencyClasses(level),
          (level === 'critical' || level === 'overdue') && 'ring-2 ring-rose-500/40 dark:ring-rose-500/30',
          isSelected && 'ring-2 ring-emerald-500 border-emerald-300 dark:ring-emerald-400 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20',
          isSubmitted && 'opacity-65 hover:opacity-90'
        )}
      >
        {/* PRIMARY TIER (Always Visible) */}
        <div className="flex items-start justify-between gap-3">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={!!isSelected}
              onChange={onToggleSelect}
              className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0 accent-emerald-600"
            />
          )}

          <div className="flex-1 min-w-0 space-y-1">
            {/* Context Badge & Urgency Pill */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <ContextIcon size={11} className="text-emerald-500" />
                <span>{contextPrefix}: {contextName}</span>
              </span>

              {renderUrgencyBadge()}

              {/* Payment status badges */}
              {isUnpaid && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 flex items-center gap-1">
                  <Banknote size={10} /> Awaiting Payment
                </span>
              )}
              {isSubmitted && assignment.paid_at && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60 flex items-center gap-1">
                  <CheckCircle2 size={10} /> Paid
                </span>
              )}
            </div>

            {/* Assignment Title & Subtitle */}
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                {assignment.assignment_type}
                {assignment.course && (
                  <span className="font-normal text-xs text-gray-500 dark:text-gray-400 ml-1.5 truncate">
                    ({assignment.course})
                  </span>
                )}
              </h3>
              <CountdownTimer deadline={assignment.deadline} />
            </div>
          </div>

          {/* Primary Action & Expand Toggle */}
          <div className="flex items-center gap-1.5 shrink-0 self-center">
            {renderPrimaryAction()}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse details' : 'Expand details'}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {/* SECONDARY TIER (Collapsed behind expand toggle) */}
        {isExpanded && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 animate-in slide-in-from-top-1 duration-150">
            {/* Subtasks Checklist */}
            <SubtasksChecklist assignmentId={assignment.id} />

            {/* Secondary Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl text-xs">
              {assignment.word_count && (
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Word Count</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{assignment.word_count.toLocaleString()} words</span>
                </div>
              )}

              {assignment.estimated_hours && (
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Est. Time</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{parseFloat(assignment.estimated_hours)} hrs</span>
                </div>
              )}

              {assignment.payment_kes && (
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Payment Amount</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">KES {parseFloat(assignment.payment_kes).toLocaleString()}</span>
                </div>
              )}

              {(assignment.context_priority || assignment.client_priority) && (
                <div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-semibold block">Priority</span>
                  <span className={cn(
                    'font-semibold text-[11px]',
                    (assignment.context_priority || assignment.client_priority) === 'High' ? 'text-rose-600 dark:text-rose-400' :
                    (assignment.context_priority || assignment.client_priority) === 'Medium' ? 'text-amber-600 dark:text-amber-400' :
                    'text-gray-600 dark:text-gray-400'
                  )}>
                    {assignment.context_priority || assignment.client_priority}
                  </span>
                </div>
              )}
            </div>

            {/* Notes Section */}
            {assignment.notes && (
              <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5 flex items-center gap-1">
                  <FileText size={12} /> Notes:
                </span>
                {assignment.notes}
              </div>
            )}

            {/* Controls & Manual Status Override Row */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-400 font-medium">Status Override:</span>
                <select
                  value={assignment.status}
                  onChange={(e) => handleStatusChange(e.target.value as AssignmentStatus)}
                  className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                >
                  {ASSIGNMENT_STATUSES.filter(s => s !== 'Cancelled').map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => setIsEditOpen(true)}
                className="text-xs text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 flex items-center gap-1 font-semibold px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <Edit2 size={12} />
                Edit Task
              </button>
            </div>
          </div>
        )}
      </div>

      <EditAssignmentModal
        assignment={assignment}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
      />
    </>
  )
}
