import { useState, useEffect } from 'react'
import type { Decision, VoteCounts } from '@/types'

interface PresentationVotingProps {
  decision: Decision
  voteCounts: VoteCounts | null
  isConnected: boolean
}

function useCountdown(openedAt: string | null, countdownSeconds: number | null) {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (!openedAt || !countdownSeconds) {
      setRemaining(null)
      return
    }

    const calculateRemaining = () => {
      const openedTime = new Date(openedAt).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - openedTime) / 1000)
      const left = countdownSeconds - elapsed
      return Math.max(0, left)
    }

    setRemaining(calculateRemaining())

    const interval = setInterval(() => {
      const left = calculateRemaining()
      setRemaining(left)
      if (left <= 0) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [openedAt, countdownSeconds])

  return remaining
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  return `${secs}`
}

export function PresentationVoting({ decision, voteCounts, isConnected }: PresentationVotingProps) {
  const total = voteCounts?.total || 0
  const percentA = total > 0 ? Math.round((voteCounts!.optionA / total) * 100) : 50
  const percentB = total > 0 ? Math.round((voteCounts!.optionB / total) * 100) : 50

  const isClosed = decision.status === 'closed'
  const winnerA = decision.winningOption === 'a'
  const winnerB = decision.winningOption === 'b'

  const remaining = useCountdown(decision.openedAt, decision.countdownSeconds)
  const isExpired = remaining !== null && remaining <= 0

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white flex flex-col items-center justify-center p-16">
      {/* Connection indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-lg animate-pulse">
          Reconnecting...
        </div>
      )}

      {/* Countdown Timer */}
      {remaining !== null && !isClosed && (
        <div className={`mb-8 animate-fade-in-up ${remaining <= 10 ? 'animate-pulse' : ''}`}>
          <div className={`text-8xl font-bold tabular-nums ${
            remaining <= 10 ? 'text-red-400' : 'text-white'
          }`}>
            {formatTime(remaining)}
          </div>
          <p className="text-2xl text-primary-300 mt-2">
            {isExpired ? 'Time up!' : 'seconds remaining'}
          </p>
        </div>
      )}

      {/* Question */}
      <h1 className="font-serif text-6xl text-center mb-16 max-w-5xl animate-fade-in-up">
        {decision.question}
      </h1>

      {/* Results Header */}
      {isClosed && (
        <div className="mb-12 animate-fade-in-up">
          <p className="text-3xl text-primary-300">The Audience Chose</p>
        </div>
      )}

      {/* Vote Bars */}
      <div className="w-full max-w-4xl space-y-8">
        <VoteBar
          label={decision.optionA}
          percent={percentA}
          count={voteCounts?.optionA || 0}
          isWinner={winnerA}
          color="primary"
        />
        <VoteBar
          label={decision.optionB}
          percent={percentB}
          count={voteCounts?.optionB || 0}
          isWinner={winnerB}
          color="purple"
        />
      </div>

      {/* Total votes */}
      <p className="text-2xl text-primary-400 mt-12">
        {total} vote{total !== 1 ? 's' : ''} cast
        {!isClosed && <span className="animate-pulse"> (Live)</span>}
      </p>
    </div>
  )
}

interface VoteBarProps {
  label: string
  percent: number
  count: number
  isWinner: boolean
  color: 'primary' | 'purple'
}

function VoteBar({ label, percent, count, isWinner, color }: VoteBarProps) {
  const bgGradient = color === 'primary'
    ? 'from-primary-600 to-primary-400'
    : 'from-purple-600 to-purple-400'

  const winnerStyles = isWinner
    ? 'ring-4 ring-green-400 ring-offset-4 ring-offset-primary-900'
    : ''

  return (
    <div className={`rounded-2xl overflow-hidden ${winnerStyles} animate-fade-in-up`}>
      <div className="flex justify-between items-center mb-3">
        <span className={`text-4xl font-medium ${isWinner ? 'text-green-300' : 'text-white'}`}>
          {label}
          {isWinner && <span className="ml-4 text-green-400">Winner!</span>}
        </span>
        <span className="text-4xl font-bold">{percent}%</span>
      </div>
      <div className="h-8 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${bgGradient} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-lg text-primary-400 mt-2">{count} votes</p>
    </div>
  )
}
