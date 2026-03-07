import { sql, toCamelCase } from '../lib/db.js'
import { NotFoundError } from '../lib/errors.js'

export interface SegmentContent {
  id: string
  segmentId: string
  contentType: 'text' | 'image' | 'youtube' | 'pdf'
  contentValue: string
  displayOrder: number
  createdAt: string
}

export const contentService = {
  async getById(id: string): Promise<SegmentContent> {
    const rows = await sql`SELECT * FROM segment_content WHERE id = ${id}`
    if (rows.length === 0) {
      throw new NotFoundError('Content')
    }
    return toCamelCase(rows[0]) as SegmentContent
  },

  async getBySegment(segmentId: string): Promise<SegmentContent[]> {
    const rows = await sql`
      SELECT * FROM segment_content
      WHERE segment_id = ${segmentId}
      ORDER BY display_order
    `
    return rows.map((row) => toCamelCase(row as Record<string, unknown>) as unknown as SegmentContent)
  },

  async create(segmentId: string, data: {
    contentType: string
    contentValue: string
    displayOrder: number
  }): Promise<SegmentContent> {
    const rows = await sql`
      INSERT INTO segment_content (segment_id, content_type, content_value, display_order)
      VALUES (${segmentId}, ${data.contentType}, ${data.contentValue}, ${data.displayOrder})
      RETURNING *
    `
    return toCamelCase(rows[0]) as SegmentContent
  },

  async update(id: string, data: {
    contentValue?: string
    displayOrder?: number
  }): Promise<SegmentContent> {
    const rows = await sql`
      UPDATE segment_content
      SET content_value = COALESCE(${data.contentValue}, content_value),
          display_order = COALESCE(${data.displayOrder}, display_order)
      WHERE id = ${id}
      RETURNING *
    `

    if (rows.length === 0) {
      throw new NotFoundError('Content')
    }

    return toCamelCase(rows[0]) as SegmentContent
  },

  async delete(id: string): Promise<void> {
    const result = await sql`DELETE FROM segment_content WHERE id = ${id}`
    if (result.length === 0) {
      throw new NotFoundError('Content')
    }
  },
}
