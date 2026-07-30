import { AxiosError } from 'axios'
import apiClient from '@/lib/api-client'
import { API_BASE_URL } from '@/lib/constants'
import type { ScheduleBlock } from '@/types'

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data?.message) return data.message
    if (data?.detail)  return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    return err.message
  }
  return 'An unexpected error occurred'
}

export async function fetchSchedule(): Promise<ScheduleBlock[]> {
  try {
    const { data } = await apiClient.get<ScheduleBlock[]>(`${API_BASE_URL}/schedule`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
export async function skipScheduleBlock({ id, date, skipped }: { id: string, date: string, skipped: boolean }): Promise<void> {
  try {
    await apiClient.post(`${API_BASE_URL}/schedule/${id}/skip`, { date, skipped })
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
