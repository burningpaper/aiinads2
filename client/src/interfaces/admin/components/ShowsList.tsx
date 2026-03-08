import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Show } from '@/types'

interface ShowsListProps {
  currentShowId: string | null
  onSelectShow: (showId: string) => void
}

export function ShowsList({ currentShowId, onSelectShow }: ShowsListProps) {
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)
  const [newTitle, setNewTitle] = useState('')

  const { data: shows = [], isLoading } = useQuery({
    queryKey: ['shows'],
    queryFn: () => api.get<Show[]>('/shows'),
  })

  const createMutation = useMutation({
    mutationFn: (title: string) => api.post<Show>('/shows', { title }),
    onSuccess: (newShow) => {
      queryClient.invalidateQueries({ queryKey: ['shows'] })
      setIsCreating(false)
      setNewTitle('')
      onSelectShow(newShow.id)
    },
  })

  const handleCreate = () => {
    if (!newTitle.trim()) return
    createMutation.mutate(newTitle.trim())
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading shows...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-gray-900">Shows</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + New Show
        </button>
      </div>

      {/* Create Show Form */}
      {isCreating && (
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Create New Show</h2>
          <div className="flex gap-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Enter show title..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setIsCreating(false)
              }}
            />
            <button
              onClick={handleCreate}
              disabled={!newTitle.trim() || createMutation.isPending}
              className="bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium"
            >
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => {
                setIsCreating(false)
                setNewTitle('')
              }}
              className="text-gray-600 hover:text-gray-800 px-4 py-2"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-3">
            A new show will be created with 5 default segments.
          </p>
        </div>
      )}

      {/* Shows List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Shows</h2>
        </div>
        {shows.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No shows yet. Create your first show to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {shows.map((show) => (
              <button
                key={show.id}
                onClick={() => onSelectShow(show.id)}
                className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left ${
                  currentShowId === show.id ? 'bg-primary-50' : ''
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium text-gray-900">{show.title}</p>
                    {currentShowId === show.id && (
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Created {new Date(show.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    show.status === 'live'
                      ? 'bg-green-100 text-green-700'
                      : show.status === 'closed'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {show.status}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
