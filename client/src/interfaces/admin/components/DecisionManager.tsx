import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { socket } from '@/lib/socket'
import type { Decision, VoteCounts } from '@/types'

interface DecisionManagerProps {
  segmentId: string
  decision: Decision | null
  voteCounts: VoteCounts | null
  isSegmentLive: boolean
}

export function DecisionManager({ segmentId, decision, voteCounts, isSegmentLive }: DecisionManagerProps) {
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [showOpenOptions, setShowOpenOptions] = useState(false)
  const [showReopenOptions, setShowReopenOptions] = useState(false)
  const [question, setQuestion] = useState(decision?.question || '')
  const [optionA, setOptionA] = useState(decision?.optionA || '')
  const [optionB, setOptionB] = useState(decision?.optionB || '')

  // Listen for real-time vote updates
  useEffect(() => {
    const handleVoteCounted = (counts: VoteCounts) => {
      if (decision && counts.decisionId === decision.id) {
        queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      }
    }

    socket.on('vote:counted', handleVoteCounted)
    return () => {
      socket.off('vote:counted', handleVoteCounted)
    }
  }, [decision?.id, segmentId, queryClient])

  const saveMutation = useMutation({
    mutationFn: (data: { question: string; optionA: string; optionB: string }) =>
      decision
        ? api.patch(`/decisions/${decision.id}`, data)
        : api.post(`/segments/${segmentId}/decision`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      setIsEditing(false)
    },
  })

  const openMutation = useMutation({
    mutationFn: (countdown?: number | null) =>
      api.post(`/decisions/${decision!.id}/open`, { countdownSeconds: countdown }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      setShowOpenOptions(false)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => api.post(`/decisions/${decision!.id}/close`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
    },
  })

  const reopenMutation = useMutation({
    mutationFn: (countdown?: number | null) =>
      api.post(`/decisions/${decision!.id}/reopen`, { countdownSeconds: countdown }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      setShowReopenOptions(false)
    },
  })

  const handleSave = () => {
    if (!question.trim() || !optionA.trim() || !optionB.trim()) return
    saveMutation.mutate({
      question: question.trim(),
      optionA: optionA.trim(),
      optionB: optionB.trim(),
    })
  }

  const handleOpenWithCountdown = (seconds: number | null) => {
    openMutation.mutate(seconds)
  }

  const handleClose = () => {
    if (confirm('Close voting?')) {
      closeMutation.mutate()
    }
  }

  const handleReopenWithCountdown = (seconds: number | null) => {
    reopenMutation.mutate(seconds)
  }

  const total = voteCounts?.total || 0
  const percentA = total > 0 ? Math.round((voteCounts!.optionA / total) * 100) : 0
  const percentB = total > 0 ? Math.round((voteCounts!.optionB / total) * 100) : 0

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Decision / Vote</h2>
        {decision?.status === 'pending' && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Edit
          </button>
        )}
      </div>

      <div className="p-6">
        {!decision && !isEditing ? (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">No decision configured for this segment.</p>
            <button
              onClick={() => setIsEditing(true)}
              className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create Decision
            </button>
          </div>
        ) : isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should we decide?"
                className="w-full border border-gray-300 rounded-lg px-4 py-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Option A</label>
                <input
                  type="text"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                  placeholder="First choice"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Option B</label>
                <input
                  type="text"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                  placeholder="Second choice"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-900 mb-4">{decision!.question}</p>

            {/* Vote Bars */}
            <div className="space-y-4 mb-6">
              <VoteBar label={decision!.optionA} percent={percentA} count={voteCounts?.optionA || 0} color="primary" />
              <VoteBar label={decision!.optionB} percent={percentB} count={voteCounts?.optionB || 0} color="purple" />
              <p className="text-sm text-gray-500 text-center">{total} total votes</p>
            </div>

            {/* Controls */}
            {decision!.status === 'pending' && isSegmentLive && !showOpenOptions && (
              <button
                onClick={() => setShowOpenOptions(true)}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-medium"
              >
                Open Voting
              </button>
            )}

            {decision!.status === 'pending' && isSegmentLive && showOpenOptions && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">Select voting duration:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleOpenWithCountdown(30)}
                    disabled={openMutation.isPending}
                    className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    30 seconds
                  </button>
                  <button
                    onClick={() => handleOpenWithCountdown(60)}
                    disabled={openMutation.isPending}
                    className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    1 minute
                  </button>
                  <button
                    onClick={() => handleOpenWithCountdown(120)}
                    disabled={openMutation.isPending}
                    className="bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    2 minutes
                  </button>
                  <button
                    onClick={() => handleOpenWithCountdown(null)}
                    disabled={openMutation.isPending}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    No timer
                  </button>
                </div>
                <button
                  onClick={() => setShowOpenOptions(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {decision!.status === 'open' && (
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                className="w-full bg-red-600 hover:bg-red-500 text-white py-3 rounded-lg font-medium"
              >
                Close Voting
              </button>
            )}

            {decision!.status === 'closed' && !showReopenOptions && (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <span className="text-green-600 font-medium">
                    Winner: {decision!.winningOption === 'a' ? decision!.optionA : decision!.optionB}
                  </span>
                </div>
                {isSegmentLive && (
                  <button
                    onClick={() => setShowReopenOptions(true)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-medium"
                  >
                    Reopen Voting
                  </button>
                )}
              </div>
            )}

            {decision!.status === 'closed' && showReopenOptions && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">Reopen voting with duration:</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleReopenWithCountdown(30)}
                    disabled={reopenMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    30 seconds
                  </button>
                  <button
                    onClick={() => handleReopenWithCountdown(60)}
                    disabled={reopenMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    1 minute
                  </button>
                  <button
                    onClick={() => handleReopenWithCountdown(120)}
                    disabled={reopenMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    2 minutes
                  </button>
                  <button
                    onClick={() => handleReopenWithCountdown(null)}
                    disabled={reopenMutation.isPending}
                    className="bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg text-sm font-medium"
                  >
                    No timer
                  </button>
                </div>
                <button
                  onClick={() => setShowReopenOptions(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

interface VoteBarProps {
  label: string
  percent: number
  count: number
  color: 'primary' | 'purple'
}

function VoteBar({ label, percent, count, color }: VoteBarProps) {
  const gradientColor = color === 'primary'
    ? 'from-primary-700 to-primary-500'
    : 'from-purple-600 to-purple-400'

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="font-medium text-gray-900">{label}</span>
        <span className="text-gray-600">{count} ({percent}%)</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradientColor} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
