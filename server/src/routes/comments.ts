import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { commentsService } from '../services/commentsService.js'
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

export { router as commentsRouter }
