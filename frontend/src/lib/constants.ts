export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export const ASSIGNMENT_TYPES = [
  'Discussion post',
  'Essay',
  'Assignment',
  'Module response',
  'Knowledge quiz',
  'Research paper',
  'Exam',
  'Simulation',
  'Other',
] as const

export const ASSIGNMENT_STATUSES = [
  'Not started',
  'In progress',
  'Submitted',
  'Overdue',
  'Cancelled',
] as const

export const BLOCK_TYPE_COLORS: Record<string, string> = {
  PROTECTED: 'bg-emerald-50 dark:bg-emerald-950/60 border-l-emerald-500 text-emerald-800 dark:text-emerald-300',
  Work:      'bg-blue-50 dark:bg-blue-950/60 border-l-blue-400 text-blue-800 dark:text-blue-300',
  Break:     'bg-amber-50 dark:bg-amber-950/60 border-l-amber-400 text-amber-800 dark:text-amber-300',
  Family:    'bg-purple-50 dark:bg-purple-950/60 border-l-purple-400 text-purple-800 dark:text-purple-300',
  Personal:  'bg-gray-50 dark:bg-gray-800/80 border-l-gray-300 dark:border-l-gray-600 text-gray-700 dark:text-gray-300',
}
