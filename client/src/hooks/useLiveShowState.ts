import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useShowStore } from '@/stores/showStore'
import { socket } from '@/lib/socket'
import { clearVotedState } from '@/lib/session'
import type { ShowState, Show, Segment, SegmentContent, Decision, VoteCounts } from '@/types'

// Poll interval to check for live show changes (5 seconds)
const POLL_INTERVAL = 5000

export function useLiveShowState() {
  const queryClient = useQueryClient()
  const currentShowIdRef = useRef<string | null>(null)
  const {
    setShow,
    setSegments,
    setActiveSegment,
    setContent,
    setDecision,
    setVoteCounts,
    setConnected,
    updateShow,
    updateSegment,
    updateDecision,
    updateVoteCounts,
  } = useShowStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['live-show'],
    queryFn: () => api.get<ShowState>('/shows/live/state'),
    refetchInterval: POLL_INTERVAL,
  })

  // Socket event handlers
  const handleShowUpdated = useCallback(
    (show: Show) => {
      updateShow(show)
    },
    [updateShow]
  )

  const handleShowReset = useCallback(() => {
    // Clear client-side voting state so users can vote again
    clearVotedState()
    queryClient.invalidateQueries({ queryKey: ['live-show'] })
  }, [queryClient])

  const handleSegmentActivated = useCallback(
    (eventData: { segment: Segment; content: SegmentContent[]; decision: Decision | null; voteCounts: VoteCounts | null }) => {
      updateSegment(eventData.segment.id, eventData.segment)
      setActiveSegment(eventData.segment)
      setContent(eventData.content)
      setDecision(eventData.decision)
      setVoteCounts(eventData.voteCounts)
    },
    [updateSegment, setActiveSegment, setContent, setDecision, setVoteCounts]
  )

  const handleContentChanged = useCallback(
    (content: SegmentContent[]) => {
      setContent(content)
    },
    [setContent]
  )

  const handleDecisionOpened = useCallback(
    (decision: Decision) => {
      updateDecision(decision)
    },
    [updateDecision]
  )

  const handleDecisionClosed = useCallback(
    (eventData: { decision: Decision; voteCounts: VoteCounts }) => {
      updateDecision(eventData.decision)
      updateVoteCounts(eventData.voteCounts)
    },
    [updateDecision, updateVoteCounts]
  )

  const handleVoteCounted = useCallback(
    (counts: VoteCounts) => {
      updateVoteCounts(counts)
    },
    [updateVoteCounts]
  )

  // Sync query data to Zustand store and manage socket room
  useEffect(() => {
    if (data) {
      const newShowId = data.show?.id || null

      // If show changed, leave old room and join new one
      if (newShowId !== currentShowIdRef.current) {
        if (currentShowIdRef.current) {
          socket.emit('leave', { room: `show:${currentShowIdRef.current}` })
        }
        if (newShowId) {
          socket.emit('join', { room: `show:${newShowId}` })
        }
        currentShowIdRef.current = newShowId
      }

      // Update store
      setShow(data.show!)
      setSegments(data.segments)
      setActiveSegment(data.activeSegment)
      setContent(data.content)
      setDecision(data.decision)
      setVoteCounts(data.voteCounts)
    }
  }, [data, setShow, setSegments, setActiveSegment, setContent, setDecision, setVoteCounts])

  // Socket connection and event handlers
  useEffect(() => {
    const handleConnect = () => {
      setConnected(true)
      // Rejoin room on reconnect
      if (currentShowIdRef.current) {
        socket.emit('join', { room: `show:${currentShowIdRef.current}` })
      }
      // Refetch state on reconnect
      queryClient.invalidateQueries({ queryKey: ['live-show'] })
    }

    const handleDisconnect = () => {
      setConnected(false)
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('show:updated', handleShowUpdated)
    socket.on('show:reset', handleShowReset)
    socket.on('segment:activated', handleSegmentActivated)
    socket.on('content:changed', handleContentChanged)
    socket.on('decision:opened', handleDecisionOpened)
    socket.on('decision:closed', handleDecisionClosed)
    socket.on('vote:counted', handleVoteCounted)

    // Connect if not already
    if (!socket.connected) {
      socket.connect()
    } else {
      setConnected(true)
      // Join room if we already have a show
      if (currentShowIdRef.current) {
        socket.emit('join', { room: `show:${currentShowIdRef.current}` })
      }
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('show:updated', handleShowUpdated)
      socket.off('show:reset', handleShowReset)
      socket.off('segment:activated', handleSegmentActivated)
      socket.off('content:changed', handleContentChanged)
      socket.off('decision:opened', handleDecisionOpened)
      socket.off('decision:closed', handleDecisionClosed)
      socket.off('vote:counted', handleVoteCounted)

      // Leave room on cleanup
      if (currentShowIdRef.current) {
        socket.emit('leave', { room: `show:${currentShowIdRef.current}` })
      }
    }
  }, [
    queryClient,
    setConnected,
    handleShowUpdated,
    handleShowReset,
    handleSegmentActivated,
    handleContentChanged,
    handleDecisionOpened,
    handleDecisionClosed,
    handleVoteCounted,
  ])

  return { isLoading, error }
}
