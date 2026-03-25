import { useState, useRef, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useShowStore } from '@/stores/showStore'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import type { Show } from '@/types'

export function DashboardHome() {
  const { show, segments, updateShow } = useShowStore()
  const queryClient = useQueryClient()
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  const updateShowMutation = useMutation({
    mutationFn: (title: string) =>
      api.patch<Show>(`/shows/${show?.id}`, { title }),
    onSuccess: (updatedShow) => {
      updateShow({ title: updatedShow.title })
      queryClient.invalidateQueries({ queryKey: ['show'] })
      setIsEditingTitle(false)
    },
  })

  const handleStartEditing = () => {
    setEditedTitle(show?.title || '')
    setIsEditingTitle(true)
  }

  const handleSaveTitle = () => {
    const trimmedTitle = editedTitle.trim()
    if (trimmedTitle && trimmedTitle !== show?.title) {
      updateShowMutation.mutate(trimmedTitle)
    } else {
      setIsEditingTitle(false)
    }
  }

  const handleCancelEditing = () => {
    setIsEditingTitle(false)
    setEditedTitle('')
  }

  const resetMutation = useMutation({
    mutationFn: () => api.post(`/shows/${show?.id}/reset`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show'] })
      setShowResetConfirm(false)
      window.location.reload()
    },
  })

  const handleExport = (type: 'votes' | 'comments') => {
    if (!show?.id) return
    window.open(`${import.meta.env.VITE_API_URL}/shows/${show.id}/export?type=${type}`, '_blank')
  }

  const liveSegment = segments.find((s) => s.status === 'live')
  const completedCount = segments.filter((s) => s.status === 'complete').length

  return (
    <div className="max-w-4xl">
      {/* Editable Show Title */}
      <div className="mb-8">
        {isEditingTitle ? (
          <div className="flex items-center gap-3">
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle()
                if (e.key === 'Escape') handleCancelEditing()
              }}
              className="font-serif text-3xl text-gray-900 bg-white border-2 border-primary-500 rounded-lg px-3 py-1 outline-none flex-1"
              disabled={updateShowMutation.isPending}
            />
            <button
              onClick={handleSaveTitle}
              disabled={updateShowMutation.isPending}
              className="p-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg transition-colors"
              title="Save"
            >
              {updateShowMutation.isPending ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <button
              onClick={handleCancelEditing}
              disabled={updateShowMutation.isPending}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title="Cancel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 group">
            <h1 className="font-serif text-3xl text-gray-900">{show?.title}</h1>
            <button
              onClick={handleStartEditing}
              className="p-2 text-gray-400 hover:text-primary-600 opacity-0 group-hover:opacity-100 transition-all"
              title="Edit show name"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Show Status</p>
          <p className={`text-2xl font-semibold ${
            show?.status === 'live' ? 'text-green-600' :
            show?.status === 'closed' ? 'text-gray-600' :
            'text-yellow-600'
          }`}>
            {show?.status?.charAt(0).toUpperCase()}{show?.status?.slice(1)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Current Segment</p>
          <p className="text-2xl font-semibold text-gray-900">
            {liveSegment ? liveSegment.orderIndex : '-'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Progress</p>
          <p className="text-2xl font-semibold text-gray-900">
            {completedCount} / {segments.length}
          </p>
        </div>
      </div>

      {/* Admin Tools */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Admin Tools</h2>
        </div>
        <div className="p-6 flex flex-wrap gap-4">
          <button
            onClick={() => handleExport('votes')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export Votes (CSV)
          </button>
          <button
            onClick={() => handleExport('comments')}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Export Comments (CSV)
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reset for Rehearsal
          </button>
        </div>

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Show?</h3>
              <p className="text-gray-600 mb-4">
                This will delete all votes, comments, and AI summaries. All segments will be reset to draft status.
                This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium"
                >
                  {resetMutation.isPending ? 'Resetting...' : 'Yes, Reset Everything'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Segments Overview */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Segments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {segments.map((segment) => (
            <Link
              key={segment.id}
              to={`/admin/segment/${segment.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {segment.orderIndex}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{segment.title}</p>
                  <p className="text-sm text-gray-500">
                    {segment.status === 'live' ? 'Currently live' :
                     segment.status === 'complete' ? 'Completed' :
                     'Not started'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                segment.status === 'live' ? 'bg-green-100 text-green-700' :
                segment.status === 'complete' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {segment.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
