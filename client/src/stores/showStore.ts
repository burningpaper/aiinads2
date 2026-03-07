import { create } from 'zustand'
import type { Show, Segment, SegmentContent, Decision, VoteCounts } from '@/types'

interface ShowStore {
  show: Show | null
  segments: Segment[]
  activeSegment: Segment | null
  content: SegmentContent[]
  decision: Decision | null
  voteCounts: VoteCounts | null
  isConnected: boolean

  setShow: (show: Show) => void
  setSegments: (segments: Segment[]) => void
  setActiveSegment: (segment: Segment | null) => void
  setContent: (content: SegmentContent[]) => void
  setDecision: (decision: Decision | null) => void
  setVoteCounts: (counts: VoteCounts | null) => void
  setConnected: (connected: boolean) => void

  updateShow: (updates: Partial<Show>) => void
  updateSegment: (id: string, updates: Partial<Segment>) => void
  updateDecision: (updates: Partial<Decision>) => void
  updateVoteCounts: (counts: Partial<VoteCounts>) => void

  reset: () => void
}

const initialState = {
  show: null,
  segments: [],
  activeSegment: null,
  content: [],
  decision: null,
  voteCounts: null,
  isConnected: false,
}

export const useShowStore = create<ShowStore>((set) => ({
  ...initialState,

  setShow: (show) => set({ show }),
  setSegments: (segments) => set({ segments }),
  setActiveSegment: (activeSegment) => set({ activeSegment }),
  setContent: (content) => set({ content }),
  setDecision: (decision) => set({ decision }),
  setVoteCounts: (voteCounts) => set({ voteCounts }),
  setConnected: (isConnected) => set({ isConnected }),

  updateShow: (updates) =>
    set((state) => ({
      show: state.show ? { ...state.show, ...updates } : null,
    })),

  updateSegment: (id, updates) =>
    set((state) => ({
      segments: state.segments.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
      activeSegment:
        state.activeSegment?.id === id
          ? { ...state.activeSegment, ...updates }
          : state.activeSegment,
    })),

  updateDecision: (updates) =>
    set((state) => ({
      decision: state.decision ? { ...state.decision, ...updates } : null,
    })),

  updateVoteCounts: (counts) =>
    set((state) => ({
      voteCounts: state.voteCounts
        ? { ...state.voteCounts, ...counts }
        : (counts as VoteCounts),
    })),

  reset: () => set(initialState),
}))
