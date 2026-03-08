import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { segmentsService } from '../services/segmentsService.js'
import { decisionsService } from '../services/decisionsService.js'
import { contentService } from '../services/contentService.js'
import { commentsService } from '../services/commentsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Get segment with full data (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await segmentsService.getFullData(req.params.id)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Update segment (admin only)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentsService.update(req.params.id, req.body)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'segment:updated', segment)

    res.json(segment)
  } catch (error) {
    next(error)
  }
})

// Get segment archive data (public)
router.get('/:id/archive', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await segmentsService.getArchiveData(req.params.id)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Activate segment (admin only)
router.post('/:id/activate', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const segment = await segmentsService.activate(req.params.id)

    // Get updated content and decision for the activated segment
    const content = await contentService.getBySegment(segment.id)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'segment:activated', segment)
    emitToShow(io, segment.showId, 'content:changed', content)

    res.json(segment)
  } catch (error) {
    next(error)
  }
})

// Add content to segment (admin only)
router.post('/:id/content', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await segmentsService.addContent(req.params.id, req.body)

    // Get segment for showId
    const segment = await segmentsService.getById(req.params.id)
    const allContent = await contentService.getBySegment(segment.id)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'content:changed', allContent)

    res.status(201).json(content)
  } catch (error) {
    next(error)
  }
})

// Create decision for segment (admin only)
router.post('/:id/decision', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await decisionsService.create(req.params.id, req.body)
    res.status(201).json(decision)
  } catch (error) {
    next(error)
  }
})

// Get comments for segment (admin only)
router.get('/:id/comments', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await segmentsService.getComments(req.params.id)
    res.json(data)
  } catch (error) {
    next(error)
  }
})

// Generate AI summary for segment comments (admin only)
router.post('/:id/summarize', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await commentsService.summarize(req.params.id)
    res.json({ summary })
  } catch (error) {
    next(error)
  }
})

export { router as segmentsRouter }
