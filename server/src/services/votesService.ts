import { sql, toCamelCase } from '../lib/db.js'
import { ValidationError } from '../lib/errors.js'
import { decisionsService } from './decisionsService.js'

export interface Vote {
  id: string
  decisionId: string
  audienceSessionId: string
  choice: 'a' | 'b'
  createdAt: string
}

export const votesService = {
  async create(data: {
    decisionId: string
    audienceSessionId: string
    choice: 'a' | 'b'
  }): Promise<Vote> {
    // Verify decision is open
    const decision = await decisionsService.getById(data.decisionId)
    if (decision.status !== 'open') {
      throw new ValidationError('Voting is not open for this decision')
    }

    // Check if already voted (constraint will also catch this)
    const existing = await sql`
      SELECT id FROM votes
      WHERE decision_id = ${data.decisionId}
      AND audience_session_id = ${data.audienceSessionId}
    `

    if (existing.length > 0) {
      throw new ValidationError('You have already voted on this decision')
    }

    const rows = await sql`
      INSERT INTO votes (decision_id, audience_session_id, choice)
      VALUES (${data.decisionId}, ${data.audienceSessionId}, ${data.choice})
      RETURNING *
    `

    return toCamelCase(rows[0]) as Vote
  },
}
