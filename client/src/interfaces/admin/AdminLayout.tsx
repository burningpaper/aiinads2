import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useShowState } from '@/hooks/useShowState'
import { setAuthTokenGetter } from '@/lib/api'
import { AdminSidebar } from './components/AdminSidebar'
import { SegmentPanel } from './components/SegmentPanel'
import { DashboardHome } from './components/DashboardHome'

const DEFAULT_SHOW_ID = import.meta.env.VITE_DEFAULT_SHOW_ID || '00000000-0000-0000-0000-000000000001'

export function AdminLayout() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const { isLoading, error } = useShowState(DEFAULT_SHOW_ID)

  // Set up auth token getter for API calls
  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600">Failed to load show data. Please refresh.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <AdminSidebar userName={user?.firstName || 'Admin'} />

      <main className="flex-1 p-8 overflow-auto">
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/segment/:segmentId" element={<SegmentPanel />} />
        </Routes>
      </main>
    </div>
  )
}
