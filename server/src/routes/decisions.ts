import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { decisionsService } from '../services/decisionsService.js'
import { segmentsService } from '../services/segmentsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Get decision by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await decisionsService.getById(req.params.id)
    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Update decision (admin only)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await decisionsService.update(req.params.id, req.body)
    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Open decision for voting (admin only)
router.post('/:id/open', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await decisionsService.open(req.params.id)

    // Get segment for showId
    const segment = await segmentsService.getById(decision.segmentId)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'decision:opened', decision)

    res.json(decision)
  } catch (error) {
    next(error)
  }
})

// Close decision (admin only)
router.post('/:id/close', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const decision = await decisionsService.close(req.params.id)
    const voteCounts = await decisionsService.getVoteCounts(decision.id)

    // Get segment for showId
    const segment = await segmentsService.getById(decision.segmentId)

    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'decision:closed', { decision, voteCounts })

    res.json({ decision, voteCounts })
  } catch (error) {
    next(error)
  }
})

export { router as decisionsRouter }
