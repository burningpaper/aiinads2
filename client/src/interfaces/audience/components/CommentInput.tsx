import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getSessionId } from '@/lib/session'

interface CommentInputProps {
  showId: string
  segmentId: string
}

const MAX_CHARS = 280

export function CommentInput({ showId, segmentId }: CommentInputProps) {
  const [content, setContent] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const submitMutation = useMutation({
    mutationFn: (comment: string) =>
      api.post('/comments', {
        showId,
        segmentId,
        audienceSessionId: getSessionId(),
        content: comment,
      }),
    onSuccess: () => {
      setContent('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 2000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitMutation.isPending) return
    submitMutation.mutate(content.trim())
  }

  const remaining = MAX_CHARS - content.length
  const isOverLimit = remaining < 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 safe-bottom">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
        <div className="relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts..."
            maxLength={MAX_CHARS + 10}
            className="w-full border border-gray-300 rounded-full px-5 py-3 pr-24 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
              {remaining}
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isOverLimit || submitMutation.isPending}
              className="bg-primary-700 hover:bg-primary-600 disabled:bg-gray-300 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            >
              {submitMutation.isPending ? '...' : 'Send'}
            </button>
          </div>
        </div>

        {showSuccess && (
          <p className="text-center text-green-600 text-sm mt-2 animate-fade-in-up">
            Comment submitted!
          </p>
        )}

        {submitMutation.isError && (
          <p className="text-center text-red-500 text-sm mt-2">
            Failed to submit. Please try again.
          </p>
        )}
      </form>
    </div>
  )
}
