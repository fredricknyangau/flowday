export type Priority = 'High' | 'Medium' | 'Low'

export type ContextType = 'Client' | 'Employer' | 'Academic' | 'Personal' | 'Other'

export type AssignmentType =
  | 'Discussion post'
  | 'Essay'
  | 'Assignment'
  | 'Module response'
  | 'Knowledge quiz'
  | 'Research paper'
  | 'Exam'
  | 'Simulation'
  | 'Other'

export type AssignmentStatus =
  | 'Not started'
  | 'In progress'
  | 'Submitted'
  | 'Overdue'
  | 'Cancelled'

export type BlockType =
  | 'Personal'
  | 'Family'
  | 'Work'
  | 'Break'
  | 'PROTECTED'

export interface Context {
  id: string
  name: string
  context_type: ContextType
  platform: string
  priority: Priority
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  active_assignments_count: number
  submitted_this_week_count: number
  overdue_assignments_count: number
  total_earnings: number
  /** Submitted but not yet paid — sum of payment_kes for awaiting-payment assignments */
  unpaid_kes: number
  unpaid_count: number
}

// Deprecated alias for backward compatibility
export type Client = Context

export interface Assignment {
  id: string
  context_id: string
  context_name: string
  context_priority?: Priority
  context_type?: ContextType
  // Deprecated field aliases
  client_id?: string
  client_name?: string
  client_priority?: Priority
  assignment_type: AssignmentType
  course: string | null
  word_count: number | null
  // Backend serialises NUMERIC columns as strings (e.g. "5.0")
  estimated_hours: string | null
  deadline: string
  status: AssignmentStatus
  payment_kes: string | null
  notes: string | null
  reminder_minutes_before: number | null
  is_active: boolean
  received_at: string
  submitted_at: string | null
  /** When money actually arrived — distinct from submitted_at (work delivered). null = unpaid. */
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface ScheduleBlock {
  id: string
  start_time: string
  label: string
  block_type: BlockType
  is_protected: boolean
  sort_order: number
  notes: string | null
}

export interface CreateAssignmentPayload {
  context_id: string
  client_id?: string
  assignment_type: AssignmentType
  course?: string
  word_count?: number
  deadline: string
  payment_kes?: number
  notes?: string
  reminder_minutes_before?: number | null
}

export type UpdateAssignmentPayload = Partial<CreateAssignmentPayload>

export interface UpdateAssignmentStatusPayload {
  status: AssignmentStatus
}

export interface MarkAssignmentPaidPayload {
  paid_at?: string | null
}

export interface CreateContextPayload {
  name: string
  context_type?: ContextType
  platform?: string
  priority?: Priority
  notes?: string
}

export type CreateClientPayload = CreateContextPayload

export interface WeekDay {
  date: string
  label: string
  assignment_count: number
  estimated_hours: number
  is_overloaded: boolean
  is_today: boolean
  is_past: boolean
  assignments: Assignment[]
}

export interface Subtask {
  id: string
  assignment_id: string
  title: string
  is_completed: boolean
  created_at: string
}
