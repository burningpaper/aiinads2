import { sql, toCamelCase, rowsToCamelCase } from '../lib/db.js'
import OpenAI from 'openai'

export interface Comment {
  id: string
  showId: string
  segmentId: string | null
  audienceSessionId: string
  content: string
  aiProcessed: boolean
  createdAt: string
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const commentsService = {
  async create(data: {
    showId: string
    segmentId: string
    audienceSessionId: string
    content: string
  }): Promise<Comment> {
    const rows = await sql`
      INSERT INTO comments (show_id, segment_id, audience_session_id, content)
      VALUES (${data.showId}, ${data.segmentId}, ${data.audienceSessionId}, ${data.content})
      RETURNING *
    `

    return toCamelCase(rows[0]) as Comment
  },

  async getBySegment(segmentId: string) {
    const rows = await sql`
      SELECT * FROM comments WHERE segment_id = ${segmentId} ORDER BY created_at DESC
    `
    return rowsToCamelCase(rows as Record<string, unknown>[])
  },

  async summarize(segmentId: string): Promise<string> {
    // Get unprocessed comments
    const comments = await sql`
      SELECT content FROM comments
      WHERE segment_id = ${segmentId} AND ai_processed = false
      ORDER BY created_at DESC
      LIMIT 50
    `

    if (comments.length === 0) {
      return 'No new comments to summarize.'
    }

    // Get existing summary
    const existing = await sql`
      SELECT content FROM ai_summaries
      WHERE segment_id = ${segmentId}
      ORDER BY created_at DESC
      LIMIT 1
    `

    const commentTexts = comments.map((c) => c.content).join('\n')
    const existingSummary = existing[0]?.content || ''

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are assisting a live creative team at an advertising conference.
Summarise the following new audience comments in 3-5 bullet points.
Focus on recurring themes, strong opinions, and anything actionable for a creative brief.
Be concise. Use plain language.`,
        },
        {
          role: 'user',
          content: `New comments:\n${commentTexts}\n\nExisting summary (if any):\n${existingSummary}`,
        },
      ],
      max_tokens: 500,
    })

    const summary = completion.choices[0]?.message?.content || 'Unable to generate summary.'

    // Save summary
    const inserted = await sql`
      INSERT INTO ai_summaries (show_id, segment_id, summary_type, content, model)
      SELECT show_id, ${segmentId}, 'comments', ${summary}, 'gpt-4o'
      FROM segments WHERE id = ${segmentId}
      RETURNING id
    `

    if (inserted.length === 0) {
      console.error(`Failed to insert AI summary for segment ${segmentId}`)
    }

    // Mark comments as processed
    await sql`
      UPDATE comments SET ai_processed = true
      WHERE segment_id = ${segmentId} AND ai_processed = false
    `

    return summary
  },
}
