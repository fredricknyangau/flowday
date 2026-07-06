import axios, { AxiosError } from 'axios'
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
    const { data } = await axios.get<Client[]>(base)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function createClient(payload: CreateClientPayload): Promise<Client> {
  try {
    const { data } = await axios.post<Client>(base, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
export async function updateClient({ id, payload }: { id: string; payload: Partial<CreateClientPayload> }): Promise<Client> {
  try {
    const { data } = await axios.patch<Client>(`${base}/${id}`, payload)
    return data
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await axios.delete(`${base}/${id}`)
  } catch (err) {
    throw new Error(extractMessage(err))
  }
}
