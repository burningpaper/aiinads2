import { useState, useEffect, useRef } from 'react'
import { useShowStore } from '@/stores/showStore'
import { useLiveShowState } from '@/hooks/useLiveShowState'
import { PresentationContent } from './components/PresentationContent'
import { PresentationVoting } from './components/PresentationVoting'
import { PanelTitleScreen } from './components/PanelTitleScreen'
import { WelcomeScreen } from './components/WelcomeScreen'
import { ThankYouScreen } from './components/ThankYouScreen'
import { HoldingScreen } from './components/HoldingScreen'

// How long to show voting results before switching to panel title (in seconds)
const RESULTS_DISPLAY_DURATION = 20

// Hook to track if results display period has ended
function useResultsTimerExpired(closedAt: string | null): boolean {
  const [expired, setExpired] = useState(false)
  const closedAtRef = useRef(closedAt)

  // Reset expired state when closedAt changes (new voting session closed)
  useEffect(() => {
    if (closedAt !== closedAtRef.current) {
      closedAtRef.current = closedAt
      setExpired(false)
    }
  }, [closedAt])

  useEffect(() => {
    if (!closedAt) {
      setExpired(false)
      return
    }

    // Check immediately and then every second
    const checkExpired = () => {
      const closedTime = new Date(closedAt).getTime()
      const now = Date.now()
      const elapsed = Math.floor((now - closedTime) / 1000)

      if (elapsed >= RESULTS_DISPLAY_DURATION) {
        setExpired(true)
        return true // Signal to stop interval
      }
      return false
    }

    // Check immediately
    if (checkExpired()) {
      return
    }

    // Check every second until expired
    const interval = setInterval(() => {
      if (checkExpired()) {
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [closedAt])

  return expired
}

export function PresentationLayout() {
  const { isLoading, error } = useLiveShowState()
  const { show, activeSegment, content, decision, voteCounts, isConnected } = useShowStore()

  // Only consider decision if it belongs to the current active segment
  const currentDecision = decision && activeSegment && decision.segmentId === activeSegment.id
    ? decision
    : null

  // Track if the 2-minute results display period has expired
  const resultsTimerExpired = useResultsTimerExpired(
    currentDecision?.status === 'closed' ? currentDecision.closedAt : null
  )

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

  // No show is currently live
  if (!show) {
    return (
      <div className="min-h-screen bg-primary-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="font-serif text-6xl mb-4">Waiting for show...</h1>
          <p className="text-primary-300 text-2xl">The presentation will begin shortly</p>
        </div>
      </div>
    )
  }

  // Show closed
  if (show.status === 'closed') {
    return <ThankYouScreen title={show.title} />
  }

  // Show not started
  if (show.status === 'setup') {
    return <WelcomeScreen title={show.title} />
  }

  // Show live but no active segment - show welcome with QR code
  if (!activeSegment) {
    return <HoldingScreen title={show.title} />
  }

  // Title Only mode - immediately show panel title screen
  if (activeSegment.titleOnly) {
    return (
      <PanelTitleScreen
        title={activeSegment.panelTitle || activeSegment.title}
        participants={activeSegment.panelParticipants}
      />
    )
  }

  // Only handle voting if decisions are enabled for this segment
  if (activeSegment.decisionEnabled) {
    // Decision is open - show voting screen
    if (currentDecision && currentDecision.status === 'open') {
      return (
        <PresentationVoting
          decision={currentDecision}
          voteCounts={voteCounts}
          isConnected={isConnected}
        />
      )
    }

    // Decision is closed (and belongs to current segment)
    if (currentDecision && currentDecision.status === 'closed') {
      // Show voting results for 20 seconds, then panel title (if configured)
      if (!resultsTimerExpired) {
        // Still within the results window - show voting results
        return (
          <PresentationVoting
            decision={currentDecision}
            voteCounts={voteCounts}
            isConnected={isConnected}
          />
        )
      }

      // Timer expired - show panel title if configured
      if (activeSegment.panelTitle) {
        return (
          <PanelTitleScreen
            title={activeSegment.panelTitle}
            participants={activeSegment.panelParticipants}
          />
        )
      }

      // No panel title configured, keep showing voting results
      return (
        <PresentationVoting
          decision={currentDecision}
          voteCounts={voteCounts}
          isConnected={isConnected}
        />
      )
    }
  }

  // Normal content view (or decisions disabled)
  return (
    <PresentationContent
      segment={activeSegment}
      content={content}
      isConnected={isConnected}
    />
  )
}
