import { sql, toCamelCase, rowsToCamelCase } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'

export interface Segment {
  id: string
  showId: string
  orderIndex: number
  title: string
  status: 'draft' | 'live' | 'complete'
  activatedAt: string | null
  completedAt: string | null
  panelTitle: string | null
  panelParticipants: string | null
  decisionEnabled: boolean
  titleOnly: boolean
}

export const segmentsService = {
  async getById(id: string) {
    const rows = await sql`SELECT * FROM segments WHERE id = ${id}`
    if (rows.length === 0) {
      throw new NotFoundError('Segment')
    }
    return toCamelCase(rows[0]) as Segment
  },

  async getFullData(segmentId: string) {
    const segment = await this.getById(segmentId)

    const content = await sql`
      SELECT * FROM segment_content WHERE segment_id = ${segmentId} ORDER BY display_order
    `

    const decisions = await sql`
      SELECT * FROM decisions WHERE segment_id = ${segmentId}
    `
    const decision = decisions[0] || null

    let voteCounts = null
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

    return {
      segment,
      content: rowsToCamelCase(content as Record<string, unknown>[]),
      decision: decision ? toCamelCase(decision) : null,
      voteCounts,
    }
  },

  async getArchiveData(segmentId: string) {
    const content = await sql`
      SELECT * FROM segment_content WHERE segment_id = ${segmentId} ORDER BY display_order
    `

    const decisions = await sql`
      SELECT * FROM decisions WHERE segment_id = ${segmentId}
    `
    const decision = decisions[0] || null

    let voteCounts = null
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

    return {
      content: rowsToCamelCase(content as Record<string, unknown>[]),
      decision: decision ? toCamelCase(decision) : null,
      voteCounts,
    }
  },

  async update(segmentId: string, data: {
    title?: string
    panelTitle?: string | null
    panelParticipants?: string | null
    decisionEnabled?: boolean
    titleOnly?: boolean
  }): Promise<Segment> {
    // Verify segment exists
    await this.getById(segmentId)

    const rows = await sql`
      UPDATE segments
      SET title = COALESCE(${data.title}, title),
          panel_title = COALESCE(${data.panelTitle}, panel_title),
          panel_participants = COALESCE(${data.panelParticipants}, panel_participants),
          decision_enabled = COALESCE(${data.decisionEnabled}, decision_enabled),
          title_only = COALESCE(${data.titleOnly}, title_only),
          updated_at = NOW()
      WHERE id = ${segmentId}
      RETURNING *
    `

    return toCamelCase(rows[0]) as Segment
  },

  async activate(segmentId: string): Promise<Segment> {
    const segment = await this.getById(segmentId)

    // Mark any currently live segment as complete
    const completed = await sql`
      UPDATE segments
      SET status = 'complete', completed_at = NOW()
      WHERE show_id = ${segment.showId} AND status = 'live'
      RETURNING id
    `

    if (completed.length > 0) {
      console.log(`Completed segment ${completed[0].id}`)
    }

    // Activate this segment
    const rows = await sql`
      UPDATE segments
      SET status = 'live', activated_at = NOW()
      WHERE id = ${segmentId}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new NotFoundError('Segment')
    }

    return toCamelCase(rows[0]) as Segment
  },

  async addContent(segmentId: string, data: {
    contentType: string
    contentValue: string
    displayOrder: number
  }) {
    const rows = await sql`
      INSERT INTO segment_content (segment_id, content_type, content_value, display_order)
      VALUES (${segmentId}, ${data.contentType}, ${data.contentValue}, ${data.displayOrder})
      RETURNING *
    `
    return toCamelCase(rows[0])
  },

  async getComments(segmentId: string) {
    const comments = await sql`
      SELECT * FROM comments WHERE segment_id = ${segmentId} ORDER BY created_at DESC
    `

    const summaries = await sql`
      SELECT * FROM ai_summaries WHERE segment_id = ${segmentId} ORDER BY created_at DESC LIMIT 1
    `

    return {
      comments: rowsToCamelCase(comments as Record<string, unknown>[]),
      summary: summaries[0] ? toCamelCase(summaries[0]) : null,
    }
  },
}
