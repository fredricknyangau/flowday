import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import type { ScheduleBlock } from '@/types'

export async function fetchSchedule(): Promise<ScheduleBlock[]> {
  const { data } = await axios.get(`${API_BASE_URL}/schedule`)
  return data
}
