import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node'

import { showsRouter } from './routes/shows.js'
import { segmentsRouter } from './routes/segments.js'
import { decisionsRouter } from './routes/decisions.js'
import { votesRouter } from './routes/votes.js'
import { commentsRouter } from './routes/comments.js'
import { contentRouter } from './routes/content.js'
import { uploadsRouter } from './routes/uploads.js'
import { errorHandler } from './middleware/errorHandler.js'
import { setupSocketHandlers } from './socket.js'

const app = express()
const httpServer = createServer(app)

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Make io available to routes
app.set('io', io)

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check (before auth middleware so it's always accessible)
app.get('/api/health', async (_, res) => {
  try {
    // Check database connectivity
    const { sql } = await import('./lib/db.js')
    await sql`SELECT 1`

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      sockets: io.engine.clientsCount,
    })
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: (error as Error).message,
    })
  }
})

app.use(ClerkExpressWithAuth())

// Routes
app.use('/api/shows', showsRouter)
app.use('/api/segments', segmentsRouter)
app.use('/api/decisions', decisionsRouter)
app.use('/api/votes', votesRouter)
app.use('/api/comments', commentsRouter)
app.use('/api/content', contentRouter)
app.use('/api/uploads', uploadsRouter)

// Error handler
app.use(errorHandler)

// Socket.io handlers
setupSocketHandlers(io)

// Start server
const PORT = process.env.PORT || 3000
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`)
})

export { io }
