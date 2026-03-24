import type { Segment, SegmentContent } from '@/types'

interface PresentationContentProps {
  segment: Segment
  content: SegmentContent[]
  isConnected: boolean
}

export function PresentationContent({ segment, content, isConnected }: PresentationContentProps) {
  const sortedContent = [...content]
    .filter((c) => c.contentType !== 'pdf') // No PDFs on presentation
    .sort((a, b) => a.displayOrder - b.displayOrder)

  // Content-aware layout: single item = full width, multiple = 2-column grid
  // YouTube always gets full width regardless
  const useGridLayout = sortedContent.length > 1

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white p-10 flex flex-col">
      {/* Connection indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-sm animate-pulse">
          Reconnecting...
        </div>
      )}

      {/* Header */}
      <header className="flex-shrink-0 mb-6">
        <p className="text-lg text-primary-400 mb-1">Segment {segment.orderIndex}</p>
        <h1 className="font-serif text-5xl">{segment.title}</h1>
      </header>

      {/* Content - fills remaining space with fade on overflow */}
      <main className="flex-1 min-h-0 relative">
        <div className="h-full overflow-hidden">
          {useGridLayout ? (
            <div className="grid grid-cols-2 gap-8 h-full">
              {sortedContent.map((item) => (
                <ContentBlock key={item.id} item={item} fullWidth={false} />
              ))}
            </div>
          ) : (
            <div className="h-full">
              {sortedContent.map((item) => (
                <ContentBlock key={item.id} item={item} fullWidth={true} />
              ))}
            </div>
          )}
        </div>
        {/* Fade overlay at bottom for overflow indication - fixed to viewport bottom */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-primary-900 to-transparent pointer-events-none" />
      </main>
    </div>
  )
}

function ContentBlock({ item, fullWidth }: { item: SegmentContent; fullWidth: boolean }) {
  switch (item.contentType) {
    case 'text':
      return (
        <div className={`animate-fade-in-up ${fullWidth ? 'col-span-2' : ''}`}>
          <div
            className={`leading-relaxed text-primary-100 ${fullWidth ? 'text-2xl max-w-5xl' : 'text-xl'}`}
            dangerouslySetInnerHTML={{ __html: formatPresentationText(item.contentValue) }}
          />
        </div>
      )

    case 'image':
      return (
        <div className={`animate-fade-in-up h-full flex ${fullWidth ? 'items-center justify-center col-span-2' : 'items-start'}`}>
          <img
            src={item.contentValue}
            alt=""
            className={`object-contain rounded-2xl shadow-2xl ${fullWidth ? 'max-h-full' : 'max-w-full max-h-full'}`}
          />
        </div>
      )

    case 'youtube':
      // YouTube always full width
      return (
        <div className="animate-fade-in-up col-span-2">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl max-h-[70vh]">
            <iframe
              src={getYouTubeEmbedUrl(item.contentValue)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )

    default:
      return null
  }
}

function formatPresentationText(text: string): string {
  return text
    .replace(/^# (.+)$/gm, '<h2 class="font-serif text-3xl mb-4">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="font-serif text-2xl mb-3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}
