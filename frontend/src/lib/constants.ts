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
  PROTECTED: 'bg-emerald-50  border-l-emerald-500 text-emerald-800',
  Work:      'bg-blue-50     border-l-blue-400    text-blue-800',
  Break:     'bg-yellow-50   border-l-yellow-400  text-yellow-800',
  Family:    'bg-purple-50   border-l-purple-400  text-purple-800',
  Personal:  'bg-gray-50     border-l-gray-300    text-gray-700',
}
