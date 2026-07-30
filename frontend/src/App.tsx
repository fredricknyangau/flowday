import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { AuthProvider } from '@/lib/auth-context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { Today } from '@/pages/Today'
import { AddAssignment } from '@/pages/AddAssignment'
import { Weekly } from '@/pages/Weekly'
import { Clients } from '@/pages/Clients'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'

function AppContent() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const navigate = useNavigate()

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N or Ctrl+N -> Navigate to /add
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/add')
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [navigate])

  return (
    <Routes>
      {/* Unprotected Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected App Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-lg mx-auto lg:max-w-none transition-colors">
              {isOffline && (
                <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
                  <WifiOff size={14} />
                  <span>Offline Mode — Cached data active</span>
                </div>
              )}
              <TopBar />
              <main>
                <Routes>
                  <Route path="/" element={<Today />} />
                  <Route path="/add" element={<AddAssignment />} />
                  <Route path="/weekly" element={<Weekly />} />
                  <Route path="/clients" element={<Clients />} />
                </Routes>
              </main>
              <BottomNav />
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  )
}
