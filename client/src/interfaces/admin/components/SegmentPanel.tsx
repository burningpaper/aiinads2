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

  const { data, isLoading } = useQuery({
    queryKey: ['segment', segmentId],
    queryFn: () => api.get<SegmentData>(`/segments/${segmentId}`),
    enabled: !!segmentId,
  })

  const activateMutation = useMutation({
    mutationFn: () => api.post(`/segments/${segmentId}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['show'] })
      queryClient.invalidateQueries({ queryKey: ['segment'] })
    },
  })

  const handleActivate = () => {
    const currentLive = segments.find((s) => s.status === 'live')
    const message = currentLive
      ? `This will complete "${currentLive.title}" and activate this segment. Continue?`
      : 'Activate this segment? It will become visible to the audience.'

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
  const canActivate = show?.status === 'live' && segment.status === 'draft'

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-8">
        {/* Segment Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Segment {segment.orderIndex}</p>
              <h1 className="font-serif text-2xl text-gray-900">{segment.title}</h1>
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
