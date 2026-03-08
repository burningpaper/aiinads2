import { sql, toCamelCase, rowsToCamelCase } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'

export interface Show {
  id: string
  title: string
  status: 'setup' | 'live' | 'closed'
  createdAt: string
  updatedAt: string
}

export const showsService = {
  async getById(id: string): Promise<Show> {
    const rows = await sql`SELECT * FROM shows WHERE id = ${id}`
    if (rows.length === 0) {
      throw new NotFoundError('Show')
    }
    return toCamelCase(rows[0]) as Show
  },

  async update(id: string, data: Partial<Pick<Show, 'title' | 'status'>>): Promise<Show> {
    // Return existing if no updates provided
    if (data.title === undefined && data.status === undefined) {
      return this.getById(id)
    }

    const rows = await sql`
      UPDATE shows
      SET title = COALESCE(${data.title}, title),
          status = COALESCE(${data.status}, status)
      WHERE id = ${id}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new NotFoundError('Show')
    }

    return toCamelCase(rows[0]) as Show
  },

  async getFullState(showId: string) {
    const show = await this.getById(showId)

    const segments = await sql`
      SELECT * FROM segments WHERE show_id = ${showId} ORDER BY order_index
    `

    const activeSegment = segments.find((s) => s.status === 'live') || null

    let content: unknown[] = []
    let decision = null
    let voteCounts = null

    if (activeSegment) {
      content = await sql`
        SELECT * FROM segment_content WHERE segment_id = ${activeSegment.id} ORDER BY display_order
      `

      const decisions = await sql`
        SELECT * FROM decisions WHERE segment_id = ${activeSegment.id}
      `
      decision = decisions[0] || null

      if (decision) {
        const counts = await sql`
          SELECT
            COUNT(*) FILTER (WHERE choice = 'a') as option_a,
            COUNT(*) FILTER (WHERE choice = 'b') as option_b,
            COUNT(*) as total
          FROM votes WHERE decision_id = ${decision.id}
        `
        const countRow = counts[0] || { option_a: '0', option_b: '0', total: '0' }
        voteCounts = {
          decisionId: decision.id,
          optionA: parseInt(String(countRow.option_a), 10) || 0,
          optionB: parseInt(String(countRow.option_b), 10) || 0,
          total: parseInt(String(countRow.total), 10) || 0,
        }
      }
    }

    return {
      show,
      segments: rowsToCamelCase(segments),
      activeSegment: activeSegment ? toCamelCase(activeSegment) : null,
      content: rowsToCamelCase(content as Record<string, unknown>[]),
      decision: decision ? toCamelCase(decision) : null,
      voteCounts,
    }
  },
}
