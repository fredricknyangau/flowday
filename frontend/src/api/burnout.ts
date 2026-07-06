import axios, { AxiosError } from 'axios'
import { API_BASE_URL } from '@/lib/constants'

export interface BurnoutStatus {
  is_at_risk: boolean
  trigger_signal: string | null
}

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data?.message) return data.message
    if (data?.detail)  return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    return err.message
  }
  return 'An unexpected error occurred'
}

export async function fetchBurnoutStatus(): Promise<BurnoutStatus> {
  try {
    const { data } = await axios.get<BurnoutStatus>(`${API_BASE_URL}/burnout/status`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
