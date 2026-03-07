import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { votesService } from '../services/votesService.js'
import { decisionsService } from '../services/decisionsService.js'
import { segmentsService } from '../services/segmentsService.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Submit vote (public)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vote = await votesService.create(req.body)

    // Get updated vote counts
    const voteCounts = await decisionsService.getVoteCounts(vote.decisionId)

    // Get decision and segment for showId
    const decision = await decisionsService.getById(vote.decisionId)
    const segment = await segmentsService.getById(decision.segmentId)

    // Emit vote count update
    const io = req.app.get('io')
    emitToShow(io, segment.showId, 'vote:counted', voteCounts)

    res.status(201).json(vote)
  } catch (error) {
    next(error)
  }
})

export { router as votesRouter }
