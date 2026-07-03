import axios, { AxiosError } from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import type {
  Assignment,
  CreateAssignmentPayload,
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
    const { data } = await axios.get<Assignment[]>(`${base}/today`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function fetchAllAssignments(): Promise<Assignment[]> {
  try {
    const { data } = await axios.get<Assignment[]>(base)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function createAssignment(
  payload: CreateAssignmentPayload,
): Promise<Assignment> {
  try {
    const { data } = await axios.post<Assignment>(base, payload)
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
    const { data } = await axios.patch<Assignment>(`${base}/${id}/status`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
