export type ShowStatus = 'setup' | 'live' | 'closed'
export type SegmentStatus = 'draft' | 'live' | 'complete'
export type DecisionStatus = 'pending' | 'open' | 'closed'
export type ContentType = 'text' | 'image' | 'youtube' | 'pdf'

export interface Show {
  id: string
  title: string
  status: ShowStatus
  createdAt: string
}

export interface Segment {
  id: string
  showId: string
  orderIndex: number
  title: string
  status: SegmentStatus
  activatedAt: string | null
  completedAt: string | null
  panelTitle: string | null
  panelParticipants: string | null
  decisionEnabled: boolean
  titleOnly: boolean
}

export interface SegmentContent {
  id: string
  segmentId: string
  contentType: ContentType
  contentValue: string
  displayOrder: number
  createdAt: string
}

export interface Decision {
  id: string
  segmentId: string
  question: string
  optionA: string
  optionB: string
  status: DecisionStatus
  winningOption: 'a' | 'b' | null
  openedAt: string | null
  closedAt: string | null
  countdownSeconds: number | null
}

export interface Vote {
  id: string
  decisionId: string
  audienceSessionId: string
  choice: 'a' | 'b'
  createdAt: string
}

export interface VoteCounts {
  decisionId: string
  optionA: number
  optionB: number
  total: number
}

export interface Comment {
  id: string
  showId: string
  segmentId: string | null
  audienceSessionId: string
  content: string
  aiProcessed: boolean
  hidden: boolean
  createdAt: string
}

export interface AiSummary {
  id: string
  showId: string
  segmentId: string | null
  summaryType: 'comments' | 'decision_context'
  content: string
  model: string
  createdAt: string
}

export interface ShowState {
  show: Show | null
  segments: Segment[]
  activeSegment: Segment | null
  content: SegmentContent[]
  decision: Decision | null
  voteCounts: VoteCounts | null
}
