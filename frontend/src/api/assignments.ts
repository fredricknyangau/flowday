import { AxiosError } from 'axios'
import apiClient from '@/lib/api-client'
import { API_BASE_URL } from '@/lib/constants'
import type {
  Assignment,
  CreateAssignmentPayload,
  UpdateAssignmentPayload,
  MarkAssignmentPaidPayload,
  Subtask,
  UpdateAssignmentStatusPayload,
} from '@/types'

const base = `${API_BASE_URL}/assignments`

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data?.message) return data.message
    if (data?.detail)  return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    return err.message
  }
  return 'An unexpected error occurred'
}

export async function fetchTodayAssignments(): Promise<Assignment[]> {
  try {
    const { data } = await apiClient.get<Assignment[]>(`${base}/today`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function fetchAllAssignments(): Promise<Assignment[]> {
  try {
    const { data } = await apiClient.get<Assignment[]>(base)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function fetchMonthlyAssignments(month?: string): Promise<Assignment[]> {
  try {
    const url = month ? `${base}/monthly?month=${month}` : `${base}/monthly`
    const { data } = await apiClient.get<Assignment[]>(url)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}


export async function createAssignment(
  payload: CreateAssignmentPayload,
): Promise<Assignment> {
  try {
    const { data } = await apiClient.post<Assignment>(base, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateAssignmentStatus(
  id: string,
  payload: UpdateAssignmentStatusPayload,
): Promise<Assignment> {
  try {
    const { data } = await apiClient.patch<Assignment>(`${base}/${id}/status`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function updateAssignment(
  id: string,
  payload: UpdateAssignmentPayload,
): Promise<Assignment> {
  try {
    const { data } = await apiClient.put<Assignment>(`${base}/${id}`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function markAssignmentPaid(
  id: string,
  payload: MarkAssignmentPaidPayload = {},
): Promise<Assignment> {
  try {
    const { data } = await apiClient.patch<Assignment>(`${base}/${id}/payment`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function fetchSubtasks(assignmentId: string): Promise<Subtask[]> {
  try {
    const { data } = await apiClient.get<Subtask[]>(`${base}/${assignmentId}/subtasks`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function createSubtask(assignmentId: string, title: string): Promise<Subtask> {
  try {
    const { data } = await apiClient.post<Subtask>(`${base}/${assignmentId}/subtasks`, { title })
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function toggleSubtask(assignmentId: string, subtaskId: string, is_completed: boolean): Promise<Subtask> {
  try {
    const { data } = await apiClient.patch<Subtask>(`${base}/${assignmentId}/subtasks/${subtaskId}`, { is_completed })
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deleteSubtask(assignmentId: string, subtaskId: string): Promise<void> {
  try {
    await apiClient.delete(`${base}/${assignmentId}/subtasks/${subtaskId}`)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}


