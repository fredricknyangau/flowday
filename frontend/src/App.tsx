import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { WifiOff } from 'lucide-react'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { Today } from '@/pages/Today'
import { AddAssignment } from '@/pages/AddAssignment'
import { Weekly } from '@/pages/Weekly'
import { Clients } from '@/pages/Clients'

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto lg:max-w-none">
      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm">
          <WifiOff size={14} />
          <span>Offline Mode — Cached data active</span>
        </div>
      )}
      <TopBar />
      <main>
        <Routes>
          <Route path="/"       element={<Today />} />
          <Route path="/add"    element={<AddAssignment />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/clients" element={<Clients />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
