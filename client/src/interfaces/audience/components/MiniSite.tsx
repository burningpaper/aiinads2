import { useState } from 'react'
import { useShowStore } from '@/stores/showStore'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { ContentRenderer } from './ContentRenderer'
import type { SegmentContent, Decision, VoteCounts } from '@/types'

interface SegmentData {
  content: SegmentContent[]
  decision: Decision | null
  voteCounts: VoteCounts | null
}

export function MiniSite() {
  const { show, segments } = useShowStore()
  const [activeIndex, setActiveIndex] = useState(0)

  const activeSegment = segments[activeIndex]

  const { data: segmentData } = useQuery({
    queryKey: ['segment-archive', activeSegment?.id],
    queryFn: () => api.get<SegmentData>(`/segments/${activeSegment?.id}/archive`),
    enabled: !!activeSegment,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-4 py-8 safe-top">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="font-serif text-3xl mb-2">{show?.title}</h1>
          <p className="text-primary-300">Event Archive</p>
        </div>
      </header>

      {/* Segment Tabs */}
      <nav className="bg-white border-b sticky top-0 z-10 overflow-x-auto">
        <div className="flex max-w-lg mx-auto">
          {segments.map((segment, index) => (
            <button
              key={segment.id}
              onClick={() => setActiveIndex(index)}
              className={`flex-1 min-w-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                index === activeIndex
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="block truncate">{index + 1}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {activeSegment && (
          <div className="mb-6">
            <h2 className="font-serif text-2xl text-gray-900">{activeSegment.title}</h2>
          </div>
        )}

        {segmentData && (
          <>
            <ContentRenderer content={segmentData.content} />

            {segmentData.decision && segmentData.decision.status === 'closed' && (
              <div className="bg-white rounded-2xl p-6 shadow-sm mt-6">
                <h3 className="font-serif text-xl text-gray-900 mb-4">
                  {segmentData.decision.question}
                </h3>

                <div className="space-y-4">
                  <ArchiveVoteResult
                    label={segmentData.decision.optionA}
                    count={segmentData.voteCounts?.optionA || 0}
                    total={segmentData.voteCounts?.total || 0}
                    isWinner={segmentData.decision.winningOption === 'a'}
                    color="primary"
                  />
                  <ArchiveVoteResult
                    label={segmentData.decision.optionB}
                    count={segmentData.voteCounts?.optionB || 0}
                    total={segmentData.voteCounts?.total || 0}
                    isWinner={segmentData.decision.winningOption === 'b'}
                    color="purple"
                  />
                </div>

                <p className="text-center text-gray-500 text-sm mt-4">
                  {segmentData.voteCounts?.total || 0} total votes
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-auto">
        <div className="text-center text-gray-500 text-sm">
          Thank you for participating!
        </div>
      </footer>
    </div>
  )
}

interface ArchiveVoteResultProps {
  label: string
  count: number
  total: number
  isWinner: boolean
  color: 'primary' | 'purple'
}

function ArchiveVoteResult({ label, count, total, isWinner, color }: ArchiveVoteResultProps) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0
  const gradientColor = color === 'primary'
    ? 'from-primary-700 to-primary-500'
    : 'from-purple-600 to-purple-400'

  return (
    <div className={`${isWinner ? 'ring-2 ring-green-500 ring-offset-2' : ''} rounded-xl`}>
      <div className="flex justify-between items-center mb-2">
        <span className={`font-medium ${isWinner ? 'text-green-700' : 'text-gray-900'}`}>
          {label}
          {isWinner && <span className="ml-2 text-green-600">Winner</span>}
        </span>
        <span className="font-semibold text-gray-900">{percent}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${gradientColor} rounded-full`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
