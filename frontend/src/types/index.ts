export type Priority = 'High' | 'Medium' | 'Low'

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

export interface Client {
  id: string
  name: string
  platform: string
  priority: Priority
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: string
  client_id: string
  client_name: string
  assignment_type: AssignmentType
  course: string | null
  word_count: number | null
  // Backend serialises NUMERIC columns as strings (e.g. "5.0")
  estimated_hours: string | null
  deadline: string
  status: AssignmentStatus
  payment_kes: string | null
  notes: string | null
  is_active: boolean
  received_at: string
  submitted_at: string | null
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
  client_id: string
  assignment_type: AssignmentType
  course?: string
  word_count?: number
  deadline: string
  payment_kes?: number
  notes?: string
}

export interface UpdateAssignmentStatusPayload {
  status: AssignmentStatus
}

export interface CreateClientPayload {
  name: string
  platform?: string
  priority?: Priority
  notes?: string
}

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
