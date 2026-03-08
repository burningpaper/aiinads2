import { Link, useLocation } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import { useShowStore } from '@/stores/showStore'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Show } from '@/types'

interface AdminSidebarProps {
  userName: string
}

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const location = useLocation()
  const { signOut } = useClerk()
  const queryClient = useQueryClient()
  const { show, segments, isConnected } = useShowStore()

  const updateShowMutation = useMutation({
    mutationFn: (status: 'live' | 'closed') =>
      api.patch<Show>(`/shows/${show?.id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show'] })
    },
  })

  const handleOpenShow = () => {
    if (confirm('Open the show? This will make content visible to the audience.')) {
      updateShowMutation.mutate('live')
    }
  }

  const handleCloseShow = () => {
    if (confirm('Close the show? This will end the live event and switch to archive mode.')) {
      updateShowMutation.mutate('closed')
    }
  }

  return (
    <aside className="w-64 bg-primary-900 text-white flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-primary-800">
        <h1 className="font-serif text-xl">Admin Panel</h1>
        <p className="text-primary-400 text-sm mt-1">Welcome, {userName}</p>
      </div>

      {/* Connection Status */}
      <div className="px-6 py-3 border-b border-primary-800">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-yellow-400 animate-pulse'}`} />
          <span className="text-sm text-primary-300">
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      {/* Show Controls */}
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-primary-300">Show Status</span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            show?.status === 'live' ? 'bg-green-500/20 text-green-300' :
            show?.status === 'closed' ? 'bg-gray-500/20 text-gray-300' :
            'bg-yellow-500/20 text-yellow-300'
          }`}>
            {show?.status?.toUpperCase()}
          </span>
        </div>

        {show?.status === 'setup' && (
          <button
            onClick={handleOpenShow}
            disabled={updateShowMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Open Show
          </button>
        )}

        {show?.status === 'live' && (
          <button
            onClick={handleCloseShow}
            disabled={updateShowMutation.isPending}
            className="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Close Show
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {/* Main Links */}
        <ul className="space-y-1 mb-6">
          <li>
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin'
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/shows"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/admin/shows'
                  ? 'bg-primary-700 text-white'
                  : 'text-primary-300 hover:bg-primary-800 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>All Shows</span>
            </Link>
          </li>
        </ul>

        {/* Segments */}
        <p className="text-xs font-medium text-primary-400 uppercase tracking-wider mb-3 px-2">
          Segments
        </p>
        <ul className="space-y-1">
          {segments.map((segment) => {
            const isActive = location.pathname === `/admin/segment/${segment.id}`
            return (
              <li key={segment.id}>
                <Link
                  to={`/admin/segment/${segment.id}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-700 text-white'
                      : 'text-primary-300 hover:bg-primary-800 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    segment.status === 'live' ? 'bg-green-400 animate-pulse' :
                    segment.status === 'complete' ? 'bg-gray-400' :
                    'bg-primary-500'
                  }`} />
                  <span className="flex-1 truncate">{segment.title}</span>
                  <span className="text-xs text-primary-500">{segment.orderIndex}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-primary-800">
        <button
          onClick={() => signOut()}
          className="w-full text-primary-400 hover:text-white py-2 text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
