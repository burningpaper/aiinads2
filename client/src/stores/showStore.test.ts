import { describe, it, expect, beforeEach } from 'vitest'
import { useShowStore } from './showStore'
import type { Show, Segment, Decision, VoteCounts } from '@/types'

const mockShow: Show = {
  id: '00000000-0000-0000-0000-000000000001',
  title: 'Test Show',
  status: 'setup',
  createdAt: '2024-01-01T00:00:00Z',
}

const mockSegment: Segment = {
  id: '00000000-0000-0000-0000-000000000011',
  showId: '00000000-0000-0000-0000-000000000001',
  orderIndex: 1,
  title: 'Test Segment',
  status: 'draft',
  activatedAt: null,
  completedAt: null,
}

const mockDecision: Decision = {
  id: '00000000-0000-0000-0000-000000000021',
  segmentId: '00000000-0000-0000-0000-000000000011',
  question: 'Test Question?',
  optionA: 'Option A',
  optionB: 'Option B',
  status: 'pending',
  winningOption: null,
  openedAt: null,
  closedAt: null,
}

const mockVoteCounts: VoteCounts = {
  decisionId: '00000000-0000-0000-0000-000000000021',
  optionA: 10,
  optionB: 5,
  total: 15,
}

describe('showStore', () => {
  beforeEach(() => {
    useShowStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have null show initially', () => {
      const { show } = useShowStore.getState()
      expect(show).toBeNull()
    })

    it('should have empty segments initially', () => {
      const { segments } = useShowStore.getState()
      expect(segments).toEqual([])
    })

    it('should not be connected initially', () => {
      const { isConnected } = useShowStore.getState()
      expect(isConnected).toBe(false)
    })
  })

  describe('setters', () => {
    it('should set show', () => {
      useShowStore.getState().setShow(mockShow)
      const { show } = useShowStore.getState()
      expect(show).toEqual(mockShow)
    })

    it('should set segments', () => {
      useShowStore.getState().setSegments([mockSegment])
      const { segments } = useShowStore.getState()
      expect(segments).toHaveLength(1)
      expect(segments[0]).toEqual(mockSegment)
    })

    it('should set active segment', () => {
      useShowStore.getState().setActiveSegment(mockSegment)
      const { activeSegment } = useShowStore.getState()
      expect(activeSegment).toEqual(mockSegment)
    })

    it('should set decision', () => {
      useShowStore.getState().setDecision(mockDecision)
      const { decision } = useShowStore.getState()
      expect(decision).toEqual(mockDecision)
    })

    it('should set vote counts', () => {
      useShowStore.getState().setVoteCounts(mockVoteCounts)
      const { voteCounts } = useShowStore.getState()
      expect(voteCounts).toEqual(mockVoteCounts)
    })

    it('should set connected status', () => {
      useShowStore.getState().setConnected(true)
      const { isConnected } = useShowStore.getState()
      expect(isConnected).toBe(true)
    })
  })

  describe('updaters', () => {
    it('should update show partially', () => {
      useShowStore.getState().setShow(mockShow)
      useShowStore.getState().updateShow({ status: 'live' })
      const { show } = useShowStore.getState()
      expect(show?.status).toBe('live')
      expect(show?.title).toBe('Test Show')
    })

    it('should not update show if null', () => {
      useShowStore.getState().updateShow({ status: 'live' })
      const { show } = useShowStore.getState()
      expect(show).toBeNull()
    })

    it('should update segment by id', () => {
      useShowStore.getState().setSegments([mockSegment])
      useShowStore.getState().updateSegment(mockSegment.id, { status: 'live' })
      const { segments } = useShowStore.getState()
      expect(segments[0].status).toBe('live')
    })

    it('should update active segment if matching id', () => {
      useShowStore.getState().setActiveSegment(mockSegment)
      useShowStore.getState().setSegments([mockSegment])
      useShowStore.getState().updateSegment(mockSegment.id, { status: 'live' })
      const { activeSegment } = useShowStore.getState()
      expect(activeSegment?.status).toBe('live')
    })

    it('should update decision partially', () => {
      useShowStore.getState().setDecision(mockDecision)
      useShowStore.getState().updateDecision({ status: 'open' })
      const { decision } = useShowStore.getState()
      expect(decision?.status).toBe('open')
      expect(decision?.question).toBe('Test Question?')
    })

    it('should update vote counts partially', () => {
      useShowStore.getState().setVoteCounts(mockVoteCounts)
      useShowStore.getState().updateVoteCounts({ optionA: 15 })
      const { voteCounts } = useShowStore.getState()
      expect(voteCounts?.optionA).toBe(15)
      expect(voteCounts?.optionB).toBe(5)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      useShowStore.getState().setShow(mockShow)
      useShowStore.getState().setSegments([mockSegment])
      useShowStore.getState().setConnected(true)

      useShowStore.getState().reset()

      const state = useShowStore.getState()
      expect(state.show).toBeNull()
      expect(state.segments).toEqual([])
      expect(state.isConnected).toBe(false)
    })
  })
})
