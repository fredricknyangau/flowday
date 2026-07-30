/**
 * Shared Axios instance for all Flowday API calls.
 *
 * Auth strategy:
 *   - Attaches `Authorization: Bearer <token>` from localStorage or env var.
 *
 * Token resolution order:
 *   1. localStorage key `flowday_jwt` (set after login/registration).
 *   2. VITE_JWT_TOKEN build-time env var (useful for local dev / CI).
 *
 * The base URL falls back to localhost for local development; in production
 * VITE_API_URL must be set in Vercel's project settings.
 */
import axios from 'axios'
import { API_BASE_URL } from '@/lib/constants'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

apiClient.interceptors.request.use((config) => {
  const jwtToken =
    localStorage.getItem('flowday_jwt') ?? import.meta.env.VITE_JWT_TOKEN

  if (jwtToken) {
    config.headers['Authorization'] = `Bearer ${jwtToken}`
  }

  return config
})

export default apiClient
