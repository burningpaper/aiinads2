import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Segment } from '@/types'

interface PanelTitleManagerProps {
  segmentId: string
  segment: Segment
}

export function PanelTitleManager({ segmentId, segment }: PanelTitleManagerProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [panelTitle, setPanelTitle] = useState(segment.panelTitle || '')
  const [panelParticipants, setPanelParticipants] = useState(segment.panelParticipants || '')

  // Sync state when segment changes
  useEffect(() => {
    setPanelTitle(segment.panelTitle || '')
    setPanelParticipants(segment.panelParticipants || '')
  }, [segment.panelTitle, segment.panelParticipants])

  const saveMutation = useMutation({
    mutationFn: (data: { panelTitle: string | null; panelParticipants: string | null }) =>
      api.patch<Segment>(`/segments/${segmentId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      setIsEditing(false)
    },
  })

  const handleSave = () => {
    saveMutation.mutate({
      panelTitle: panelTitle.trim() || null,
      panelParticipants: panelParticipants.trim() || null,
    })
  }

  const handleCancel = () => {
    setPanelTitle(segment.panelTitle || '')
    setPanelParticipants(segment.panelParticipants || '')
    setIsEditing(false)
  }

  const hasContent = segment.panelTitle || segment.panelParticipants

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Panel Title Slide</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            {hasContent ? 'Edit' : 'Configure'}
          </button>
        )}
      </div>

      <div className="p-6">
        {!hasContent && !isEditing ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">
              Configure the panel title slide that appears after voting closes.
            </p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Add Panel Title
            </button>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Panel Title
              </label>
              <input
                type="text"
                value={panelTitle}
                onChange={(e) => setPanelTitle(e.target.value)}
                placeholder="e.g., AI in Creative Advertising"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participants
              </label>
              <textarea
                value={panelParticipants}
                onChange={(e) => setPanelParticipants(e.target.value)}
                placeholder="e.g., Jane Smith (Moderator), John Doe (Google), Sarah Lee (Meta)"
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter participant names, one per line or comma-separated
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Title</p>
              <p className="text-lg font-medium text-gray-900">{segment.panelTitle}</p>
            </div>
            {segment.panelParticipants && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Participants</p>
                <p className="text-gray-700 whitespace-pre-line">{segment.panelParticipants}</p>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-4">
              This slide will display on the presentation screen after voting closes.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
