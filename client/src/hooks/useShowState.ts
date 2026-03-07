import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useShowStore } from '@/stores/showStore'
import { useSocket } from './useSocket'
import type { ShowState } from '@/types'

export function useShowState(showId: string) {
  const queryClient = useQueryClient()
  const {
    setShow,
    setSegments,
    setActiveSegment,
    setContent,
    setDecision,
    setVoteCounts,
  } = useShowStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['show', showId],
    queryFn: () => api.get<ShowState>(`/shows/${showId}/state`),
    enabled: !!showId,
  })

  // Sync query data to Zustand store
  useEffect(() => {
    if (data) {
      setShow(data.show!)
      setSegments(data.segments)
      setActiveSegment(data.activeSegment)
      setContent(data.content)
      setDecision(data.decision)
      setVoteCounts(data.voteCounts)
    }
  }, [data, setShow, setSegments, setActiveSegment, setContent, setDecision, setVoteCounts])

  // Socket connection for real-time updates
  useSocket(showId)

  // Refetch on reconnect
  useEffect(() => {
    const handleReconnect = () => {
      queryClient.invalidateQueries({ queryKey: ['show', showId] })
    }

    window.addEventListener('online', handleReconnect)
    return () => window.removeEventListener('online', handleReconnect)
  }, [showId, queryClient])

  return { isLoading, error }
}
