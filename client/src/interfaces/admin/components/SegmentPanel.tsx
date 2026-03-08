import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useShowStore } from '@/stores/showStore'
import { api } from '@/lib/api'
import { ContentManager } from './ContentManager'
import { DecisionManager } from './DecisionManager'
import { CommentsPanel } from './CommentsPanel'
import type { Segment, SegmentContent, Decision, VoteCounts } from '@/types'

interface SegmentData {
  segment: Segment
  content: SegmentContent[]
  decision: Decision | null
  voteCounts: VoteCounts | null
}

export function SegmentPanel() {
  const { segmentId } = useParams<{ segmentId: string }>()
  const queryClient = useQueryClient()
  const { show, segments } = useShowStore()
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['segment', segmentId],
    queryFn: () => api.get<SegmentData>(`/segments/${segmentId}`),
    enabled: !!segmentId,
  })

  useEffect(() => {
    if (data?.segment.title) {
      setEditedTitle(data.segment.title)
    }
  }, [data?.segment.title])

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/segments/${segmentId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show'] })
      queryClient.invalidateQueries({ queryKey: ['segment'] })
    },
  })

  const updateTitleMutation = useMutation({
    mutationFn: (title: string) => api.patch(`/segments/${segmentId}`, { title }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      queryClient.invalidateQueries({ queryKey: ['show'] })
      setIsEditingTitle(false)
    },
  })

  const handleActivate = () => {
    const currentLive = segments.find((s) => s.status === 'live')
    let message: string

    if (currentLive) {
      const isGoingBack = data?.segment && data.segment.orderIndex < currentLive.orderIndex
      message = isGoingBack
        ? `Go back to "${data.segment.title}"? The current segment "${currentLive.title}" will be marked complete.`
        : `This will complete "${currentLive.title}" and activate this segment. Continue?`
    } else {
      message = 'Activate this segment? It will become visible to the audience.'
    }

    if (confirm(message)) {
      activateMutation.mutate()
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading segment...</p>
      </div>
    )
  }

  const { segment, content, decision, voteCounts } = data
  const canActivate = show?.status === 'live' && segment.status !== 'live'

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Segment Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Segment {segment.orderIndex}</p>
              {isEditingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="font-serif text-2xl text-gray-900 border-b-2 border-blue-500 focus:outline-none bg-transparent"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateTitleMutation.mutate(editedTitle)
                      } else if (e.key === 'Escape') {
                        setEditedTitle(segment.title)
                        setIsEditingTitle(false)
                      }
                    }}
                  />
                  <button
                    onClick={() => updateTitleMutation.mutate(editedTitle)}
                    disabled={updateTitleMutation.isPending}
                    className="text-green-600 hover:text-green-700 p-1"
                    title="Save"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditedTitle(segment.title)
                      setIsEditingTitle(false)
                    }}
                    className="text-gray-400 hover:text-gray-600 p-1"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="font-serif text-2xl text-gray-900">{segment.title}</h1>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-gray-400 hover:text-gray-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Edit title"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              segment.status === 'live' ? 'bg-green-100 text-green-700' :
              segment.status === 'complete' ? 'bg-gray-100 text-gray-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {segment.status}
            </span>
          </div>

          {canActivate && (
            <button
              onClick={handleActivate}
              disabled={activateMutation.isPending}
              className="bg-green-600 hover:bg-green-500 disabled:bg-green-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {activateMutation.isPending ? 'Activating...' : 'Activate Segment'}
            </button>
          )}

          {segment.status === 'live' && (
            <p className="text-green-600 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              This segment is live
            </p>
          )}
        </div>

        {/* Content Manager */}
        <ContentManager segmentId={segment.id} content={content} />

        {/* Decision Manager */}
        <DecisionManager
          segmentId={segment.id}
          decision={decision}
          voteCounts={voteCounts}
          isSegmentLive={segment.status === 'live'}
        />
      </div>

      {/* Comments Sidebar */}
      <div className="lg:col-span-1">
        <CommentsPanel showId={show!.id} segmentId={segment.id} />
      </div>
    </div>
  )
}
