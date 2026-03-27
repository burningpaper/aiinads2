import { sql, toCamelCase, rowsToCamelCase } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'

export interface Show {
  id: string
  title: string
  status: 'setup' | 'live' | 'closed'
  showMiniSite: boolean
  createdAt: string
  updatedAt: string
}

export const showsService = {
  async list(): Promise<Show[]> {
    const rows = await sql`SELECT * FROM shows ORDER BY created_at DESC`
    return rowsToCamelCase(rows) as Show[]
  },

  async getLive(): Promise<Show | null> {
    const rows = await sql`SELECT * FROM shows WHERE status = 'live' LIMIT 1`
    if (rows.length === 0) {
      return null
    }
    return toCamelCase(rows[0]) as Show
  },

  async getActiveOrClosed(): Promise<Show | null> {
    // Priority 1: Live show (event in progress)
    const liveRows = await sql`SELECT * FROM shows WHERE status = 'live' LIMIT 1`
    if (liveRows.length > 0) {
      return toCamelCase(liveRows[0]) as Show
    }

    // Priority 2: Show explicitly set to display mini-site
    const miniSiteRows = await sql`SELECT * FROM shows WHERE show_mini_site = true ORDER BY updated_at DESC LIMIT 1`
    if (miniSiteRows.length > 0) {
      return toCamelCase(miniSiteRows[0]) as Show
    }

    return null
  },

  async create(title: string): Promise<Show> {
    // Create the show
    const showRows = await sql`
      INSERT INTO shows (title, status)
      VALUES (${title}, 'setup')
      RETURNING *
    `
    const show = toCamelCase(showRows[0]) as Show

    // Create 5 default segments
    const segmentTitles = [
      'Introduction',
      'Segment 2',
      'Segment 3',
      'Segment 4',
      'Conclusion',
    ]

    for (let i = 0; i < segmentTitles.length; i++) {
      await sql`
        INSERT INTO segments (show_id, order_index, title, status)
        VALUES (${show.id}, ${i + 1}, ${segmentTitles[i]}, 'draft')
      `
    }

    return show
  },

  async getById(id: string): Promise<Show> {
    const rows = await sql`SELECT * FROM shows WHERE id = ${id}`
    if (rows.length === 0) {
      throw new NotFoundError('Show')
    }
    return toCamelCase(rows[0]) as Show
  },

  async update(id: string, data: Partial<Pick<Show, 'title' | 'status' | 'showMiniSite'>>): Promise<Show> {
    // Return existing if no updates provided
    if (data.title === undefined && data.status === undefined && data.showMiniSite === undefined) {
      return this.getById(id)
    }

    // Only one show can be live at a time - close all other live shows
    if (data.status === 'live') {
      await sql`UPDATE shows SET status = 'closed' WHERE status = 'live' AND id != ${id}`
    }

    // Only one show can have mini-site enabled at a time
    if (data.showMiniSite === true) {
      await sql`UPDATE shows SET show_mini_site = false WHERE show_mini_site = true AND id != ${id}`
    }

    const rows = await sql`
      UPDATE shows
      SET title = COALESCE(${data.title}, title),
          status = COALESCE(${data.status}, status),
          show_mini_site = COALESCE(${data.showMiniSite}, show_mini_site)
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

  async resetForRehearsal(showId: string) {
    // Verify show exists
    await this.getById(showId)

    // Delete all votes for this show's decisions
    await sql`
      DELETE FROM votes
      WHERE decision_id IN (
        SELECT d.id FROM decisions d
        JOIN segments s ON d.segment_id = s.id
        WHERE s.show_id = ${showId}
      )
    `

    // Delete all comments for this show
    await sql`DELETE FROM comments WHERE show_id = ${showId}`

    // Delete all AI summaries for this show
    await sql`DELETE FROM ai_summaries WHERE show_id = ${showId}`

    // Reset all decisions to pending
    await sql`
      UPDATE decisions
      SET status = 'pending', winning_option = NULL, opened_at = NULL, closed_at = NULL
      WHERE segment_id IN (SELECT id FROM segments WHERE show_id = ${showId})
    `

    // Reset all segments to draft
    await sql`
      UPDATE segments
      SET status = 'draft', activated_at = NULL, completed_at = NULL
      WHERE show_id = ${showId}
    `

    // Reset show to setup
    await sql`UPDATE shows SET status = 'setup' WHERE id = ${showId}`

    return { success: true, message: 'Show reset for rehearsal' }
  },

  async exportVotes(showId: string): Promise<string> {
    const rows = await sql`
      SELECT
        s.title as segment_title,
        d.question,
        d.option_a,
        d.option_b,
        v.choice,
        v.audience_session_id,
        v.created_at
      FROM votes v
      JOIN decisions d ON v.decision_id = d.id
      JOIN segments s ON d.segment_id = s.id
      WHERE s.show_id = ${showId}
      ORDER BY s.order_index, v.created_at
    `

    const headers = ['Segment', 'Question', 'Option A', 'Option B', 'Choice', 'Session ID', 'Timestamp']
    const csvRows = rows.map((r) => [
      r.segment_title,
      r.question,
      r.option_a,
      r.option_b,
      r.choice === 'a' ? r.option_a : r.option_b,
      r.audience_session_id,
      new Date(r.created_at).toISOString(),
    ])

    return [headers, ...csvRows].map((row) =>
      row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  },

  async exportComments(showId: string): Promise<string> {
    const rows = await sql`
      SELECT
        s.title as segment_title,
        c.content,
        c.audience_session_id,
        c.hidden,
        c.created_at
      FROM comments c
      LEFT JOIN segments s ON c.segment_id = s.id
      WHERE c.show_id = ${showId}
      ORDER BY c.created_at
    `

    const headers = ['Segment', 'Comment', 'Session ID', 'Hidden', 'Timestamp']
    const csvRows = rows.map((r) => [
      r.segment_title || 'General',
      r.content,
      r.audience_session_id,
      r.hidden ? 'Yes' : 'No',
      new Date(r.created_at).toISOString(),
    ])

    return [headers, ...csvRows].map((row) =>
      row.map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')
  },
}
