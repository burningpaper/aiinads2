import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { showsService } from '../services/showsService.js'
import { requireAuth } from '../middleware/auth.js'
import { emitToShow } from '../socket.js'

const router = Router()

// List all shows (admin only)
router.get('/', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const shows = await showsService.list()
    res.json(shows)
  } catch (error) {
    next(error)
  }
})

// Create a new show (admin only)
router.post('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title } = req.body
    if (!title || typeof title !== 'string') {
      res.status(400).json({ error: 'Title is required' })
      return
    }
    const show = await showsService.create(title.trim())
    res.status(201).json(show)
  } catch (error) {
    next(error)
  }
})

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

// Reset show for rehearsal (admin only)
router.post('/:id/reset', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await showsService.resetForRehearsal(req.params.id)

    // Emit reset event so all clients refresh
    const io = req.app.get('io')
    emitToShow(io, req.params.id, 'show:reset', { showId: req.params.id })

    res.json(result)
  } catch (error) {
    next(error)
  }
})

// Export votes and comments as CSV (admin only)
router.get('/:id/export', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type } = req.query
    const showId = req.params.id

    if (type === 'votes') {
      const data = await showsService.exportVotes(showId)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="votes-${showId}.csv"`)
      res.send(data)
    } else if (type === 'comments') {
      const data = await showsService.exportComments(showId)
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename="comments-${showId}.csv"`)
      res.send(data)
    } else {
      res.status(400).json({ error: 'Invalid export type. Use ?type=votes or ?type=comments' })
    }
  } catch (error) {
    next(error)
  }
})

export { router as showsRouter }
