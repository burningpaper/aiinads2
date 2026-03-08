import { sql, toCamelCase } from '../lib/db.js'
import { NotFoundError, ValidationError } from '../lib/errors.js'

export interface Decision {
  id: string
  segmentId: string
  question: string
  optionA: string
  optionB: string
  status: 'pending' | 'open' | 'closed'
  winningOption: 'a' | 'b' | null
  openedAt: string | null
  closedAt: string | null
}

export const decisionsService = {
  async getById(id: string): Promise<Decision> {
    const rows = await sql`SELECT * FROM decisions WHERE id = ${id}`
    if (rows.length === 0) {
      throw new NotFoundError('Decision')
    }
    return toCamelCase(rows[0]) as Decision
  },

  async create(segmentId: string, data: {
    question: string
    optionA: string
    optionB: string
  }): Promise<Decision> {
    const rows = await sql`
      INSERT INTO decisions (segment_id, question, option_a, option_b)
      VALUES (${segmentId}, ${data.question}, ${data.optionA}, ${data.optionB})
      RETURNING *
    `
    return toCamelCase(rows[0]) as Decision
  },

  async update(id: string, data: {
    question?: string
    optionA?: string
    optionB?: string
  }): Promise<Decision> {
    const decision = await this.getById(id)

    if (decision.status !== 'pending') {
      throw new ValidationError('Cannot edit a decision that has been opened')
    }

    const rows = await sql`
      UPDATE decisions
      SET question = COALESCE(${data.question}, question),
          option_a = COALESCE(${data.optionA}, option_a),
          option_b = COALESCE(${data.optionB}, option_b)
      WHERE id = ${id}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new NotFoundError('Decision')
    }

    return toCamelCase(rows[0]) as Decision
  },

  async open(id: string): Promise<Decision> {
    const decision = await this.getById(id)

    if (decision.status !== 'pending') {
      throw new ValidationError('Decision can only be opened from pending status')
    }

    const rows = await sql`
      UPDATE decisions
      SET status = 'open', opened_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return toCamelCase(rows[0]) as Decision
  },

  async close(id: string): Promise<Decision> {
    const decision = await this.getById(id)

    if (decision.status !== 'open') {
      throw new ValidationError('Decision can only be closed from open status')
    }

    // Calculate winner
    const counts = await sql`
      SELECT
        COUNT(*) FILTER (WHERE choice = 'a') as option_a,
        COUNT(*) FILTER (WHERE choice = 'b') as option_b
      FROM votes WHERE decision_id = ${id}
    `

    // COUNT always returns a row, but be defensive
    const countRow = counts[0] || { option_a: '0', option_b: '0' }
    const countA = parseInt(String(countRow.option_a), 10) || 0
    const countB = parseInt(String(countRow.option_b), 10) || 0
    const winningOption = countA >= countB ? 'a' : 'b'

    const rows = await sql`
      UPDATE decisions
      SET status = 'closed', closed_at = NOW(), winning_option = ${winningOption}
      WHERE id = ${id}
      RETURNING *
    `

    return toCamelCase(rows[0]) as Decision
  },

  async getVoteCounts(decisionId: string) {
    const counts = await sql`
      SELECT
        COUNT(*) FILTER (WHERE choice = 'a') as option_a,
        COUNT(*) FILTER (WHERE choice = 'b') as option_b,
        COUNT(*) as total
      FROM votes WHERE decision_id = ${decisionId}
    `

    const countRow = counts[0] || { option_a: '0', option_b: '0', total: '0' }
    return {
      decisionId,
      optionA: parseInt(String(countRow.option_a), 10) || 0,
      optionB: parseInt(String(countRow.option_b), 10) || 0,
      total: parseInt(String(countRow.total), 10) || 0,
    }
  },
}
