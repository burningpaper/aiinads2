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

// Get currently live or recently closed show state (public - for audience/presentation view)
router.get('/live/state', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Returns live show, or most recently closed show for mini-site
    const show = await showsService.getActiveOrClosed()
    if (!show) {
      res.json({ show: null, segments: [], activeSegment: null, content: [], decision: null, voteCounts: null })
      return
    }
    const state = await showsService.getFullState(show.id)
    res.json(state)
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
    const io = req.app.get('io')

    // If setting this show to live, find other live shows to notify after update
    let previouslyLiveShows: { id: string }[] = []
    if (req.body.status === 'live') {
      const allShows = await showsService.list()
      previouslyLiveShows = allShows.filter(s => s.status === 'live' && s.id !== req.params.id)
    }

    const show = await showsService.update(req.params.id, req.body)

    // Emit update to the updated show's clients
    emitToShow(io, show.id, 'show:updated', show)

    // Notify clients of shows that were auto-closed
    for (const closedShow of previouslyLiveShows) {
      const updatedClosedShow = await showsService.getById(closedShow.id)
      emitToShow(io, closedShow.id, 'show:updated', updatedClosedShow)
    }

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
