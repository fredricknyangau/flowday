import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, LoginPayload, RegisterPayload, loginUser, registerUser, fetchCurrentUser } from '@/api/auth'

interface AuthContextType {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('flowday_jwt') || import.meta.env.VITE_JWT_TOKEN || null
  })

  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('flowday_user')
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        return null
      }
    }
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('flowday_jwt') || import.meta.env.VITE_JWT_TOKEN
      if (!storedToken) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await fetchCurrentUser()
        setUser(currentUser)
        localStorage.setItem('flowday_user', JSON.stringify(currentUser))
      } catch (err) {
        console.warn('Auth session invalid or expired:', err)
        // If token is invalid or 401, clear local state
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    verifyAuth()
  }, [])

  const handleLogin = async (payload: LoginPayload) => {
    const res = await loginUser(payload)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('flowday_jwt', res.token)
    localStorage.setItem('flowday_user', JSON.stringify(res.user))
  }

  const handleRegister = async (payload: RegisterPayload) => {
    const res = await registerUser(payload)
    setToken(res.token)
    setUser(res.user)
    localStorage.setItem('flowday_jwt', res.token)
    localStorage.setItem('flowday_user', JSON.stringify(res.user))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('flowday_jwt')
    localStorage.removeItem('flowday_user')
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: Boolean(token),
        isLoading,
        login: handleLogin,
        register: handleRegister,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
