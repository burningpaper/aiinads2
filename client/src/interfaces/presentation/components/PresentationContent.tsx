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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white p-16">
      {/* Connection indicator */}
      {!isConnected && (
        <div className="fixed top-4 right-4 bg-yellow-500/20 text-yellow-300 px-4 py-2 rounded-full text-lg animate-pulse">
          Reconnecting...
        </div>
      )}

      {/* Header */}
      <header className="mb-16">
        <p className="text-2xl text-primary-400 mb-2">Segment {segment.orderIndex}</p>
        <h1 className="font-serif text-7xl">{segment.title}</h1>
      </header>

      {/* Content */}
      <main className="grid grid-cols-2 gap-16">
        {sortedContent.map((item) => (
          <ContentBlock key={item.id} item={item} />
        ))}
      </main>
    </div>
  )
}

function ContentBlock({ item }: { item: SegmentContent }) {
  switch (item.contentType) {
    case 'text':
      return (
        <div className="animate-fade-in-up">
          <div
            className="text-3xl leading-relaxed text-primary-100"
            dangerouslySetInnerHTML={{ __html: formatPresentationText(item.contentValue) }}
          />
        </div>
      )

    case 'image':
      return (
        <div className="animate-fade-in-up">
          <img
            src={item.contentValue}
            alt=""
            className="w-full h-auto rounded-2xl shadow-2xl"
          />
        </div>
      )

    case 'youtube':
      return (
        <div className="animate-fade-in-up col-span-2">
          <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
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
    .replace(/^# (.+)$/gm, '<h2 class="font-serif text-5xl mb-6">$1</h2>')
    .replace(/^## (.+)$/gm, '<h3 class="font-serif text-4xl mb-4">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-6">')
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}
