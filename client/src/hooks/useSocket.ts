import { useEffect, useCallback } from 'react'
import { socket, connectSocket, joinShowRoom, leaveShowRoom } from '@/lib/socket'
import { useShowStore } from '@/stores/showStore'
import type { Show, Segment, Decision, VoteCounts, SegmentContent } from '@/types'

export function useSocket(showId: string | null) {
  const {
    setConnected,
    updateShow,
    updateSegment,
    setActiveSegment,
    setContent,
    setDecision,
    updateDecision,
    updateVoteCounts,
  } = useShowStore()

  const handleConnect = useCallback(() => {
    setConnected(true)
    if (showId) {
      joinShowRoom(showId)
    }
  }, [showId, setConnected])

  const handleDisconnect = useCallback(() => {
    setConnected(false)
  }, [setConnected])

  const handleShowUpdated = useCallback(
    (show: Show) => {
      updateShow(show)
    },
    [updateShow]
  )

  const handleSegmentActivated = useCallback(
    (segment: Segment) => {
      updateSegment(segment.id, segment)
      setActiveSegment(segment)
    },
    [updateSegment, setActiveSegment]
  )

  const handleContentChanged = useCallback(
    (content: SegmentContent[]) => {
      setContent(content)
    },
    [setContent]
  )

  const handleDecisionOpened = useCallback(
    (decision: Decision) => {
      setDecision(decision)
    },
    [setDecision]
  )

  const handleDecisionClosed = useCallback(
    (data: { decision: Decision; voteCounts: VoteCounts }) => {
      updateDecision(data.decision)
      updateVoteCounts(data.voteCounts)
    },
    [updateDecision, updateVoteCounts]
  )

  const handleVoteCounted = useCallback(
    (counts: VoteCounts) => {
      updateVoteCounts(counts)
    },
    [updateVoteCounts]
  )

  useEffect(() => {
    connectSocket()

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('show:updated', handleShowUpdated)
    socket.on('segment:activated', handleSegmentActivated)
    socket.on('content:changed', handleContentChanged)
    socket.on('decision:opened', handleDecisionOpened)
    socket.on('decision:closed', handleDecisionClosed)
    socket.on('vote:counted', handleVoteCounted)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('show:updated', handleShowUpdated)
      socket.off('segment:activated', handleSegmentActivated)
      socket.off('content:changed', handleContentChanged)
      socket.off('decision:opened', handleDecisionOpened)
      socket.off('decision:closed', handleDecisionClosed)
      socket.off('vote:counted', handleVoteCounted)

      if (showId) {
        leaveShowRoom(showId)
      }
    }
  }, [
    showId,
    handleConnect,
    handleDisconnect,
    handleShowUpdated,
    handleSegmentActivated,
    handleContentChanged,
    handleDecisionOpened,
    handleDecisionClosed,
    handleVoteCounted,
  ])

  return { isConnected: socket.connected }
}
