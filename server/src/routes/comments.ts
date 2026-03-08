import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { commentsService } from '../services/commentsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Submit comment (public)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const comment = await commentsService.create(req.body)

    // Emit to admin
    const io = req.app.get('io')
    emitToShow(io, comment.showId, 'comment:received', comment)

    res.status(201).json(comment)
  } catch (error) {
    next(error)
  }
})

// Hide/show comment (admin only)
router.patch('/:id/visibility', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { hidden } = req.body
    const comment = await commentsService.setHidden(req.params.id, hidden)

    // Emit update so presentation screen hides/shows accordingly
    const io = req.app.get('io')
    emitToShow(io, comment.showId, 'comment:updated', comment)

    res.json(comment)
  } catch (error) {
    next(error)
  }
})

export { router as commentsRouter }
