import { v4 as uuidv4 } from 'uuid'

const SESSION_KEY = 'audience_session_id'

export function getSessionId(): string {
  let sessionId = localStorage.getItem(SESSION_KEY)

  if (!sessionId) {
    sessionId = uuidv4()
    localStorage.setItem(SESSION_KEY, sessionId)
  }

  return sessionId
}

export function hasVoted(decisionId: string): boolean {
  return localStorage.getItem(`voted_${decisionId}`) === 'true'
}

export function markVoted(decisionId: string): void {
  localStorage.setItem(`voted_${decisionId}`, 'true')
}
