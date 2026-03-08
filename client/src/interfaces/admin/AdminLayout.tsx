import { useEffect, useState, useCallback } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useShowState } from '@/hooks/useShowState'
import { setAuthTokenGetter } from '@/lib/api'
import { AdminSidebar } from './components/AdminSidebar'
import { SegmentPanel } from './components/SegmentPanel'
import { DashboardHome } from './components/DashboardHome'
import { ShowsList } from './components/ShowsList'

const DEFAULT_SHOW_ID = import.meta.env.VITE_DEFAULT_SHOW_ID || '00000000-0000-0000-0000-000000000001'
const SHOW_ID_KEY = 'admin_current_show_id'

function getStoredShowId(): string {
  return localStorage.getItem(SHOW_ID_KEY) || DEFAULT_SHOW_ID
}

export function AdminLayout() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [currentShowId, setCurrentShowId] = useState(getStoredShowId)
  const { isLoading, error } = useShowState(currentShowId)

  // Set up auth token getter for API calls
  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])

  const handleSelectShow = useCallback((showId: string) => {
    localStorage.setItem(SHOW_ID_KEY, showId)
    setCurrentShowId(showId)
    navigate('/admin')
  }, [navigate])

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
          <p className="text-gray-600 mb-4">Failed to load show data.</p>
          <button
            onClick={() => navigate('/admin/shows')}
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Shows
          </button>
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
          <Route
            path="/shows"
            element={
              <ShowsList
                currentShowId={currentShowId}
                onSelectShow={handleSelectShow}
              />
            }
          />
          <Route path="/segment/:segmentId" element={<SegmentPanel />} />
        </Routes>
      </main>
    </div>
  )
}
