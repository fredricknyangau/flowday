import { API_BASE_URL } from '@/lib/constants'
import apiClient from '@/lib/api-client'

export interface TenantSettings {
  timezone: string
  day_boundary_hour: number
  daily_capacity_hours: number
  reminder_minutes_before: number
}

export interface UpdateTenantSettingsPayload {
  timezone?: string
  day_boundary_hour?: number
  daily_capacity_hours?: number
  reminder_minutes_before?: number
}

const base = `${API_BASE_URL}/auth/settings`

export async function fetchTenantSettings(): Promise<TenantSettings> {
  const { data } = await apiClient.get<TenantSettings>(base)
  return data
}

export async function updateTenantSettings(payload: UpdateTenantSettingsPayload): Promise<TenantSettings> {
  const { data } = await apiClient.patch<TenantSettings>(base, payload)
  return data
}
