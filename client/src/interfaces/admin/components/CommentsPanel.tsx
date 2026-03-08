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

  const visibilityMutation = useMutation({
    mutationFn: ({ commentId, hidden }: { commentId: string; hidden: boolean }) =>
      api.patch<Comment>(`/comments/${commentId}/visibility`, { hidden }),
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

    const handleCommentUpdated = (comment: Comment) => {
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? comment : c))
      )
    }

    socket.on('comment:received', handleNewComment)
    socket.on('comment:updated', handleCommentUpdated)
    return () => {
      socket.off('comment:received', handleNewComment)
      socket.off('comment:updated', handleCommentUpdated)
    }
  }, [segmentId, showId])

  const handleToggleVisibility = (comment: Comment) => {
    visibilityMutation.mutate(
      { commentId: comment.id, hidden: !comment.hidden },
      {
        onSuccess: (updatedComment: Comment) => {
          setComments((prev) =>
            prev.map((c) => (c.id === updatedComment.id ? updatedComment : c))
          )
        },
      }
    )
  }

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
            <div
              key={comment.id}
              className={`px-6 py-3 animate-fade-in-up group ${
                comment.hidden ? 'bg-red-50 opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${comment.hidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {comment.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(comment.createdAt).toLocaleTimeString()}
                    {comment.hidden && <span className="ml-2 text-red-500">Hidden</span>}
                  </p>
                </div>
                <button
                  onClick={() => handleToggleVisibility(comment)}
                  disabled={visibilityMutation.isPending}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-xs font-medium ${
                    comment.hidden
                      ? 'text-green-600 hover:bg-green-50'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                  title={comment.hidden ? 'Show comment' : 'Hide comment'}
                >
                  {comment.hidden ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
