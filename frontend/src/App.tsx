import { Routes, Route } from 'react-router-dom'
import { TopBar } from '@/components/TopBar'
import { BottomNav } from '@/components/BottomNav'
import { Today } from '@/pages/Today'
import { AddAssignment } from '@/pages/AddAssignment'
import { Weekly } from '@/pages/Weekly'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-lg mx-auto lg:max-w-none">
      <TopBar />
      <main>
        <Routes>
          <Route path="/"       element={<Today />} />
          <Route path="/add"    element={<AddAssignment />} />
          <Route path="/weekly" element={<Weekly />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
