import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'
import type { Client } from '@/types'

const base = `${API_BASE_URL}/clients`

export async function fetchClients(): Promise<Client[]> {
  const { data } = await axios.get(base)
  return data
}
