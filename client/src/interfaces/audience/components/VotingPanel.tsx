import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getSessionId, hasVoted, markVoted } from '@/lib/session'
import type { Decision, VoteCounts } from '@/types'

interface VotingPanelProps {
  decision: Decision
  voteCounts: VoteCounts | null
}

export function VotingPanel({ decision, voteCounts }: VotingPanelProps) {
  const [voted, setVoted] = useState(() => hasVoted(decision.id))
  const [selectedChoice, setSelectedChoice] = useState<'a' | 'b' | null>(null)

  const voteMutation = useMutation({
    mutationFn: (choice: 'a' | 'b') =>
      api.post('/votes', {
        decisionId: decision.id,
        audienceSessionId: getSessionId(),
        choice,
      }),
    onSuccess: (_, choice) => {
      markVoted(decision.id)
      setVoted(true)
      setSelectedChoice(choice)
    },
  })

  const handleVote = (choice: 'a' | 'b') => {
    if (voted || voteMutation.isPending) return
    voteMutation.mutate(choice)
  }

  const total = voteCounts?.total || 0
  const percentA = total > 0 ? Math.round((voteCounts!.optionA / total) * 100) : 50
  const percentB = total > 0 ? Math.round((voteCounts!.optionB / total) * 100) : 50

  // Decision is closed - show results
  if (decision.status === 'closed') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
        <h3 className="font-serif text-xl text-gray-900 mb-6">{decision.question}</h3>

        <div className="space-y-4">
          <VoteResult
            label={decision.optionA}
            percent={percentA}
            isWinner={decision.winningOption === 'a'}
            color="primary"
          />
          <VoteResult
            label={decision.optionB}
            percent={percentB}
            isWinner={decision.winningOption === 'b'}
            color="purple"
          />
        </div>

        <p className="text-center text-gray-500 text-sm mt-4">
          {total} vote{total !== 1 ? 's' : ''} cast
        </p>
      </div>
    )
  }

  // Decision is open - show voting UI or waiting state
  if (decision.status === 'open') {
    if (voted) {
      return (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
          <h3 className="font-serif text-xl text-gray-900 mb-4">{decision.question}</h3>

          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-medium">Vote submitted!</span>
            </div>
          </div>

          <div className="space-y-4 mt-4">
            <VoteResult label={decision.optionA} percent={percentA} isSelected={selectedChoice === 'a'} color="primary" />
            <VoteResult label={decision.optionB} percent={percentB} isSelected={selectedChoice === 'b'} color="purple" />
          </div>

          <p className="text-center text-gray-500 text-sm mt-4 animate-pulse">
            Live results updating...
          </p>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
        <h3 className="font-serif text-xl text-gray-900 mb-6">{decision.question}</h3>

        <div className="space-y-4">
          <button
            onClick={() => handleVote('a')}
            disabled={voteMutation.isPending}
            className="w-full bg-primary-700 hover:bg-primary-600 disabled:bg-primary-400 text-white py-5 rounded-2xl font-medium text-lg transition-all duration-200 active:scale-[0.98] min-h-[72px]"
          >
            {decision.optionA}
          </button>

          <button
            onClick={() => handleVote('b')}
            disabled={voteMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-400 text-white py-5 rounded-2xl font-medium text-lg transition-all duration-200 active:scale-[0.98] min-h-[72px]"
          >
            {decision.optionB}
          </button>
        </div>

        {voteMutation.isError && (
          <p className="text-center text-red-500 text-sm mt-4">
            Failed to submit vote. Please try again.
          </p>
        )}
      </div>
    )
  }

  return null
}

interface VoteResultProps {
  label: string
  percent: number
  isWinner?: boolean
  isSelected?: boolean
  color: 'primary' | 'purple'
}

function VoteResult({ label, percent, isWinner, isSelected, color }: VoteResultProps) {
  const gradientColor = color === 'primary'
    ? 'from-primary-700 to-primary-500'
    : 'from-purple-600 to-purple-400'

  return (
    <div className={`${isWinner ? 'ring-2 ring-green-500 ring-offset-2' : ''} rounded-xl`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${isWinner ? 'text-green-700' : 'text-gray-900'} ${isSelected ? 'underline' : ''}`}>
          {label}
          {isWinner && <span className="ml-2 text-green-600">Winner!</span>}
        </span>
        <span className="font-semibold text-gray-900">{percent}%</span>
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
