import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import type {
  Assignment,
  CreateAssignmentPayload,
  UpdateAssignmentStatusPayload,
} from '@/types'

const base = `${API_BASE_URL}/assignments`

export async function fetchTodayAssignments(): Promise<Assignment[]> {
  const { data } = await axios.get(`${base}/today`)
  return data
}

export async function fetchAllAssignments(): Promise<Assignment[]> {
  const { data } = await axios.get(base)
  return data
}

export async function createAssignment(
  payload: CreateAssignmentPayload
): Promise<Assignment> {
  const { data } = await axios.post(base, payload)
  return data
}

export async function updateAssignmentStatus(
  id: string,
  payload: UpdateAssignmentStatusPayload
): Promise<Assignment> {
  const { data } = await axios.patch(`${base}/${id}/status`, payload)
  return data
}
