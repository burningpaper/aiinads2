import { useShowStore } from '@/stores/showStore'
import { useShowState } from '@/hooks/useShowState'
import { PresentationContent } from './components/PresentationContent'
import { PresentationVoting } from './components/PresentationVoting'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ThankYouScreen } from './components/ThankYouScreen'
import { HoldingScreen } from './components/HoldingScreen'

const DEFAULT_SHOW_ID = import.meta.env.VITE_DEFAULT_SHOW_ID || '00000000-0000-0000-0000-000000000001'

export function PresentationLayout() {
  const { isLoading, error } = useShowState(DEFAULT_SHOW_ID)
  const { show, activeSegment, content, decision, voteCounts, isConnected } = useShowStore()

  // Full-screen error recovery
  if (error) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="font-serif text-4xl mb-4">Reconnecting...</h1>
          <p className="text-primary-300">Please wait</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-white text-4xl animate-pulse">Loading...</div>
      </div>
    )
  }

  // Show closed
  if (show?.status === 'closed') {
    return <ThankYouScreen title={show.title} />
  }

  // Show not started
  if (show?.status === 'setup') {
    return <WelcomeScreen title={show.title} />
  }

  // Show live but no active segment - show welcome with QR code
  if (!activeSegment) {
    return <HoldingScreen title={show?.title} />
  }

  // Decision is open or just closed - show voting screen
  if (decision && (decision.status === 'open' || decision.status === 'closed')) {
    return (
      <PresentationVoting
        decision={decision}
        voteCounts={voteCounts}
        isConnected={isConnected}
      />
    )
  }

  // Normal content view
  return (
    <PresentationContent
      segment={activeSegment}
      content={content}
      isConnected={isConnected}
    />
  )
}
