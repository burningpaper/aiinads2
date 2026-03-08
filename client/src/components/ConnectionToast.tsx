import { useState, useEffect } from 'react'
import { socket } from '@/lib/socket'

export function ConnectionToast() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'reconnected' | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let hideTimeout: ReturnType<typeof setTimeout>

    const handleConnect = () => {
      // Only show "reconnected" if we were previously disconnected
      if (status === 'disconnected') {
        setStatus('reconnected')
        setVisible(true)
        hideTimeout = setTimeout(() => setVisible(false), 3000)
      }
    }

    const handleDisconnect = () => {
      setStatus('disconnected')
      setVisible(true)
    }

    // Set initial status
    if (socket.connected) {
      setStatus('connected')
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)

    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      if (hideTimeout) clearTimeout(hideTimeout)
    }
  }, [status])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      {status === 'disconnected' && (
        <div className="bg-yellow-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="font-medium">Reconnecting...</span>
        </div>
      )}
      {status === 'reconnected' && (
        <div className="bg-green-500 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">Reconnected</span>
        </div>
      )}
    </div>
  )
}
