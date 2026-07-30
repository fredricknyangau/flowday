import { AxiosError } from 'axios'
import apiClient from '@/lib/api-client'
import { API_BASE_URL } from '@/lib/constants'
import type { Client, CreateClientPayload } from '@/types'

const base = `${API_BASE_URL}/clients`

function extractMessage(err: unknown): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data
    if (data?.message) return data.message
    if (data?.detail)  return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
    return err.message
  }
  return 'An unexpected error occurred'
}

export async function fetchClients(): Promise<Client[]> {
  try {
    const { data } = await apiClient.get<Client[]>(base)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  try {
    const { data } = await apiClient.post<Client>(base, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
export async function updateClient({ id, payload }: { id: string; payload: Partial<CreateClientPayload> }): Promise<Client> {
  try {
    const { data } = await apiClient.patch<Client>(`${base}/${id}`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await apiClient.delete(`${base}/${id}`)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export interface ClientAnalytics {
  total_collected_kes: number
  pending_payout_kes: number
  total_words_submitted: number
  completed_assignments_count: number
  avg_rate_per_1000_words: number
  monthly_target_kes: number
  monthly_progress_pct: number
}

export async function fetchClientAnalytics(): Promise<ClientAnalytics> {
  try {
    const { data } = await apiClient.get<ClientAnalytics>(`${base}/analytics`)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

