import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { showsService } from '../services/showsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// Get show state (public)
router.get('/:id/state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const state = await showsService.getFullState(req.params.id)
    res.json(state)
  } catch (error) {
    next(error)
  }
})

// Get show by ID (public)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const show = await showsService.getById(req.params.id)
    res.json(show)
  } catch (error) {
    next(error)
  }
})

// Update show (admin only)
router.patch('/:id', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const show = await showsService.update(req.params.id, req.body)

    // Emit update to all clients
    const io = req.app.get('io')
    emitToShow(io, show.id, 'show:updated', show)

    res.json(show)
  } catch (error) {
    next(error)
  }
})

export { router as showsRouter }
