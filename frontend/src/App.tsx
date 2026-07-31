import { useState, useEffect } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { WifiOff, RefreshCw } from 'lucide-react'
import { AuthProvider } from '@/lib/auth-context'
import { LockProvider, useLock } from '@/lib/lock-context'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { LockScreen } from '@/components/LockScreen'
import { FirstTimePinModal } from '@/components/FirstTimePinModal'
import { Today } from '@/pages/Today'
import { AddAssignment } from '@/pages/AddAssignment'
import { Weekly } from '@/pages/Weekly'
import { Monthly } from '@/pages/Monthly'
import { Contexts } from '@/pages/Contexts'
import { More } from '@/pages/More'
import { ScheduleSettingsShell } from '@/pages/settings/ScheduleSettingsShell'
import { RemindersSettingsShell } from '@/pages/settings/RemindersSettingsShell'
import { SecuritySettingsShell } from '@/pages/settings/SecuritySettingsShell'
import { Login } from '@/pages/Login'
import { Register } from '@/pages/Register'
import { useQueuedMutationsCount, useExecutingMutationsCount } from '@/lib/offline-persister'

function AppContent() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const { isLocked } = useLock()
  const queuedCount = useQueuedMutationsCount()
  const executingCount = useExecutingMutationsCount()
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
            {isLocked && <LockScreen />}
            <FirstTimePinModal />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 max-w-lg mx-auto lg:max-w-none transition-colors">
              {isOffline && (
                <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
                  <WifiOff size={14} />
                  <span>
                    {queuedCount > 0
                      ? `Offline — ${queuedCount} change${queuedCount > 1 ? 's' : ''} will sync when reconnected`
                      : 'Offline Mode — Cached data active'}
                  </span>
                </div>
              )}
              {!isOffline && executingCount > 0 && (
                <div className="bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm animate-pulse">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Syncing {executingCount} pending change{executingCount > 1 ? 's' : ''}...</span>
                </div>
              )}
              <TopBar />
              <main>
                <Routes>
                  <Route path="/" element={<Today />} />
                  <Route path="/add" element={<AddAssignment />} />
                  <Route path="/plan" element={<Weekly />} />
                  <Route path="/weekly" element={<Weekly />} />
                  <Route path="/monthly" element={<Monthly />} />
                  <Route path="/contexts" element={<Contexts />} />
                  <Route path="/clients" element={<Contexts />} />
                  <Route path="/more" element={<More />} />
                  <Route path="/settings/schedule" element={<ScheduleSettingsShell />} />
                  <Route path="/settings/reminders" element={<RemindersSettingsShell />} />
                  <Route path="/settings/security" element={<SecuritySettingsShell />} />
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
        <LockProvider>
          <AppContent />
        </LockProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}
