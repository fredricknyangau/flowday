import { API_BASE_URL } from '@/lib/constants'
import apiClient from '@/lib/api-client'
import type { Context, CreateContextPayload } from '@/types'

const base = `${API_BASE_URL}/contexts`

export async function fetchContexts(): Promise<Context[]> {
  const { data } = await apiClient.get<Context[]>(base)
  return data
}

export async function createContext(payload: CreateContextPayload): Promise<Context> {
  const { data } = await apiClient.post<Context>(base, payload)
  return data
}

export async function updateContext({ id, payload }: { id: string; payload: Partial<CreateContextPayload> }): Promise<Context> {
  const { data } = await apiClient.patch<Context>(`${base}/${id}`, payload)
  return data
}

export async function deleteContext(id: string): Promise<void> {
  await apiClient.delete(`${base}/${id}`)
}

export interface ContextAnalytics {
  total_collected_kes: number
  pending_payout_kes: number
  total_words_submitted: number
  completed_assignments_count: number
  avg_rate_per_1000_words: number
  monthly_target_kes: number
  monthly_progress_pct: number
}

export type ClientAnalytics = ContextAnalytics

export async function fetchContextAnalytics(): Promise<ContextAnalytics> {
  const { data } = await apiClient.get<ContextAnalytics>(`${base}/analytics`)
  return data
}

// Deprecated export aliases for backward compatibility during rollout
export const fetchClients = fetchContexts
export const createClient = createContext
export const updateClient = updateContext
export const deleteClient = deleteContext
export const fetchClientAnalytics = fetchContextAnalytics
