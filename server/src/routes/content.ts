import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { contentService } from '../services/contentService.js'
import { segmentsService } from '../services/segmentsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Update content (admin only)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await contentService.update(req.params.id, req.body)

    // Get segment for showId and emit update
    const segment = await segmentsService.getById(content.segmentId)
    const allContent = await contentService.getBySegment(segment.id)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'content:changed', allContent)

    res.json(content)
  } catch (error) {
    next(error)
  }
})

// Delete content (admin only)
router.delete('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await contentService.getById(req.params.id)
    const segment = await segmentsService.getById(content.segmentId)

    await contentService.delete(req.params.id)

    // Emit update
    const allContent = await contentService.getBySegment(segment.id)
    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'content:changed', allContent)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export { router as contentRouter }
