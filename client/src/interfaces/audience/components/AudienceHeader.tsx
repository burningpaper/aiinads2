import type { Segment } from '@/types'
import { useShowStore } from '@/stores/showStore'

interface AudienceHeaderProps {
  segment: Segment
}

export function AudienceHeader({ segment }: AudienceHeaderProps) {
  const { segments, isConnected } = useShowStore()
  const totalSegments = segments.length

  return (
    <header className="sticky top-0 z-10 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white px-4 py-4 safe-top">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm text-primary-300">
            Segment {segment.orderIndex} of {totalSegments}
          </p>
          {!isConnected && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full animate-pulse">
              Reconnecting...
            </span>
          )}
        </div>
        <h1 className="font-serif text-xl mt-1">{segment.title}</h1>
      </div>
    </header>
  )
}
