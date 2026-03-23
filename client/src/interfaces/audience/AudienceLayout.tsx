import { useShowStore } from '@/stores/showStore'
import { useLiveShowState } from '@/hooks/useLiveShowState'
import { AudienceHeader } from './components/AudienceHeader'
import { ContentRenderer } from './components/ContentRenderer'
import { VotingPanel } from './components/VotingPanel'
import { CommentInput } from './components/CommentInput'
import { HoldingScreen } from './components/HoldingScreen'
import { MiniSite } from './components/MiniSite'

export function AudienceLayout() {
  const { isLoading, error } = useLiveShowState()
  const { show, activeSegment, content, decision, voteCounts } = useShowStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-white text-xl animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center p-6">
        <div className="text-white text-center">
          <h1 className="font-serif text-2xl mb-4">Connection Error</h1>
          <p className="text-gray-400">Please check your connection and refresh.</p>
        </div>
      </div>
    )
  }

  // Show closed - render mini-site
  if (show?.status === 'closed') {
    return <MiniSite />
  }

  // Show not live or no active segment - holding screen
  if (show?.status === 'setup' || !activeSegment) {
    return <HoldingScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AudienceHeader segment={activeSegment} />

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <ContentRenderer content={content} />

        {decision && decision.status !== 'pending' && (
          <VotingPanel decision={decision} voteCounts={voteCounts} />
        )}
      </main>

      {show?.status === 'live' && <CommentInput showId={show.id} segmentId={activeSegment.id} />}
    </div>
  )
}
