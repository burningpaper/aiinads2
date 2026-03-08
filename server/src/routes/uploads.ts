import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import multer from 'multer'
import { uploadFile } from '../lib/storage.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// Configure multer for memory storage (we'll stream to R2)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
})

// Upload image
router.post(
  '/image',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' })
        return
      }

      const result = await uploadFile(req.file.buffer, req.file.mimetype, 'image')
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
)

// Upload PDF
router.post(
  '/pdf',
  requireAuth,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file provided' })
        return
      }

      const result = await uploadFile(req.file.buffer, req.file.mimetype, 'pdf')
      res.json(result)
    } catch (error) {
      next(error)
    }
  }
)

export { router as uploadsRouter }
