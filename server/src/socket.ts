import type { Server, Socket } from 'socket.io'

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`)

    // Join a show room
    socket.on('join', ({ room }: { room: string }) => {
      socket.join(room)
      console.log(`${socket.id} joined room: ${room}`)
    })

    // Leave a show room
    socket.on('leave', ({ room }: { room: string }) => {
      socket.leave(room)
      console.log(`${socket.id} left room: ${room}`)
    })

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`)
    })
  })
}

// Helper to emit to a show room
export function emitToShow(io: Server, showId: string, event: string, data: unknown) {
  io.to(`show:${showId}`).emit(event, data)
}
