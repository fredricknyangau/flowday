import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare, Square, Plus, Trash2, ListTodo } from 'lucide-react'
import { fetchSubtasks, createSubtask, toggleSubtask, deleteSubtask } from '@/api/assignments'

interface Props {
  assignmentId: string
}

export function SubtasksChecklist({ assignmentId }: Props) {
  const queryClient = useQueryClient()
  const [newTitle, setNewTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: subtasks = [] } = useQuery({
    queryKey: ['subtasks', assignmentId],
    queryFn: () => fetchSubtasks(assignmentId),
  })

  const addMutation = useMutation({
    mutationFn: (title: string) => createSubtask(assignmentId, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', assignmentId] })
      setNewTitle('')
      setIsAdding(false)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ subtaskId, isCompleted }: { subtaskId: string; isCompleted: boolean }) =>
      toggleSubtask(assignmentId, subtaskId, isCompleted),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', assignmentId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (subtaskId: string) => deleteSubtask(assignmentId, subtaskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subtasks', assignmentId] })
    },
  })

  const completedCount = subtasks.filter((s) => s.is_completed).length
  const progressPct = subtasks.length > 0 ? Math.round((completedCount / subtasks.length) * 100) : 0

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    addMutation.mutate(newTitle.trim())
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <ListTodo size={13} className="text-emerald-600 dark:text-emerald-400" />
          <span>Milestones ({completedCount}/{subtasks.length})</span>
        </div>

        {subtasks.length > 0 && (
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            {progressPct}%
          </span>
        )}
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mb-2.5">
          <div
            className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-1.5">
        {subtasks.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
          >
            <button
              onClick={() => toggleMutation.mutate({ subtaskId: s.id, isCompleted: !s.is_completed })}
              className="flex items-center gap-2 text-left flex-1 min-w-0"
            >
              {s.is_completed ? (
                <CheckSquare size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Square size={14} className="text-gray-400 shrink-0" />
              )}
              <span
                className={
                  s.is_completed
                    ? 'line-through text-gray-400 dark:text-gray-500 truncate'
                    : 'text-gray-700 dark:text-gray-200 truncate font-medium'
                }
              >
                {s.title}
              </span>
            </button>

            <button
              onClick={() => deleteMutation.mutate(s.id)}
              className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded transition-opacity"
              title="Delete milestone"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Add subtask form / button */}
      {isAdding ? (
        <form onSubmit={handleAdd} className="mt-2 flex items-center gap-1.5">
          <input
            type="text"
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Draft Outline, Proofread..."
            className="flex-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <button
            type="submit"
            disabled={addMutation.isPending}
            className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus size={12} />
          Add milestone
        </button>
      )}
    </div>
  )
}
