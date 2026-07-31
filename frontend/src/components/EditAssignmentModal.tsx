import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Save, AlertCircle } from 'lucide-react'
import { updateAssignment } from '@/api/assignments'
import { fetchContexts } from '@/api/contexts'
import { ASSIGNMENT_TYPES } from '@/lib/constants'
import type { Assignment, AssignmentType } from '@/types'

interface Props {
  assignment: Assignment
  isOpen: boolean
  onClose: () => void
}

export function EditAssignmentModal({ assignment, isOpen, onClose }: Props) {
  const queryClient = useQueryClient()
  const [contextId, setContextId] = useState(assignment.context_id || assignment.client_id || '')
  const [assignmentType, setAssignmentType] = useState<AssignmentType>(assignment.assignment_type)
  const [course, setCourse] = useState(assignment.course ?? '')
  const [wordCount, setWordCount] = useState<string>(assignment.word_count?.toString() ?? '')
  const [deadline, setDeadline] = useState<string>(
    new Date(assignment.deadline).toISOString().slice(0, 16)
  )
  const [paymentKes, setPaymentKes] = useState<string>(assignment.payment_kes?.toString() ?? '')
  const [notes, setNotes] = useState(assignment.notes ?? '')
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number | null>(
    assignment.reminder_minutes_before ?? null
  )
  const [formError, setFormError] = useState<string | null>(null)

  const { data: contexts = [] } = useQuery({
    queryKey: ['contexts'],
    queryFn: fetchContexts,
  })

  const { mutate, isPending } = useMutation({
    mutationKey: ['updateAssignment'],
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof updateAssignment>[1] }) =>
      updateAssignment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
      onClose()
    },
    onError: (err: Error) => {
      setFormError(err.message)
    },
  })

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    if (!contextId) {
      setFormError('Please select a work context')
      return
    }
    if (!deadline) {
      setFormError('Please enter a deadline')
      return
    }
    mutate({
      id: assignment.id,
      body: {
        context_id: contextId,
        assignment_type: assignmentType,
        course: course.trim() || undefined,
        word_count: wordCount ? parseInt(wordCount, 10) : undefined,
        deadline: new Date(deadline).toISOString(),
        payment_kes: paymentKes ? parseFloat(paymentKes) : undefined,
        notes: notes.trim() || undefined,
        reminder_minutes_before: reminderMinutesBefore,
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3 mb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Edit Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Context select */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Work Context *
            </label>
            <select
              value={contextId}
              onChange={(e) => setContextId(e.target.value)}
              className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {contexts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.context_type || 'Client'})
                </option>
              ))}
            </select>
          </div>

          {/* Type & Course */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Type *
              </label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as AssignmentType)}
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {ASSIGNMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Course
              </label>
              <input
                type="text"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="e.g. NURS 401"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Word Count & Payment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Word Count
              </label>
              <input
                type="number"
                value={wordCount}
                onChange={(e) => setWordCount(e.target.value)}
                placeholder="e.g. 1500"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Payment (KES)
              </label>
              <input
                type="number"
                value={paymentKes}
                onChange={(e) => setPaymentKes(e.target.value)}
                placeholder="e.g. 3500"
                className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Deadline *
            </label>
            <input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Notes / Instructions
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Requirements, portal link, special instructions..."
              className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Reminder override */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Reminder Lead Time
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                placeholder="Workspace default"
                min={5}
                max={1440}
                value={reminderMinutesBefore ?? ''}
                onChange={(e) =>
                  setReminderMinutesBefore(e.target.value ? Math.max(5, Math.min(1440, Number(e.target.value))) : null)
                }
                className="w-28 text-xs border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">min</span>
              <div className="flex items-center gap-1">
                {[30, 60, 120, 240].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReminderMinutesBefore(reminderMinutesBefore === preset ? null : preset)}
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                      reminderMinutesBefore === preset
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-emerald-400 hover:text-emerald-600'
                    }`}
                  >
                    {preset < 60 ? `${preset}m` : `${preset / 60}h`}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Leave blank to use workspace default.</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save size={14} />
              {isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
