import { useEffect, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { socket } from '@/lib/socket'
import type { Comment, AiSummary } from '@/types'

interface CommentsPanelProps {
  showId: string
  segmentId: string
}

interface CommentsData {
  comments: Comment[]
  summary: AiSummary | null
}

export function CommentsPanel({ showId, segmentId }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])

  const { data, isLoading } = useQuery({
    queryKey: ['comments', segmentId],
    queryFn: () => api.get<CommentsData>(`/segments/${segmentId}/comments`),
  })

  const regenerateMutation = useMutation({
    mutationFn: () => api.post(`/segments/${segmentId}/summarize`, {}),
  })

  // Sync initial data
  useEffect(() => {
    if (data?.comments) {
      setComments(data.comments)
    }
  }, [data])

  // Listen for new comments via socket
  useEffect(() => {
    const handleNewComment = (comment: Comment) => {
      if (comment.segmentId === segmentId || comment.showId === showId) {
        setComments((prev) => [comment, ...prev])
      }
    }

    socket.on('comment:received', handleNewComment)
    return () => {
      socket.off('comment:received', handleNewComment)
    }
  }, [segmentId, showId])

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <p className="text-gray-500">Loading comments...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden sticky top-8">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900">Live Comments</h2>
        <p className="text-sm text-gray-500">{comments.length} comments</p>
      </div>

      {/* AI Summary */}
      {data?.summary && (
        <div className="px-6 py-4 bg-primary-50 border-b border-primary-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary-700 uppercase tracking-wider">AI Summary</span>
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              className="text-xs text-primary-600 hover:text-primary-700"
            >
              {regenerateMutation.isPending ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-line">{data.summary.content}</p>
        </div>
      )}

      {!data?.summary && comments.length >= 5 && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <button
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            {regenerateMutation.isPending ? 'Generating summary...' : 'Generate AI Summary'}
          </button>
        </div>
      )}

      {/* Comments Feed */}
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
        {comments.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            No comments yet. They will appear here in real-time.
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="px-6 py-3 animate-fade-in-up">
              <p className="text-gray-700 text-sm">{comment.content}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(comment.createdAt).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
