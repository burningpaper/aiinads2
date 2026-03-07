import type { SegmentContent } from '@/types'

interface ContentRendererProps {
  content: SegmentContent[]
}

export function ContentRenderer({ content }: ContentRendererProps) {
  const sortedContent = [...content].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="space-y-6">
      {sortedContent.map((item) => (
        <ContentItem key={item.id} item={item} />
      ))}
    </div>
  )
}

function ContentItem({ item }: { item: SegmentContent }) {
  switch (item.contentType) {
    case 'text':
      return (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
          <div
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: formatText(item.contentValue) }}
          />
        </div>
      )

    case 'image':
      return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in-up">
          <img
            src={item.contentValue}
            alt=""
            className="w-full h-auto"
            loading="lazy"
          />
        </div>
      )

    case 'youtube':
      return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-fade-in-up">
          <div className="aspect-video">
            <iframe
              src={getYouTubeEmbedUrl(item.contentValue)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )

    case 'pdf':
      return (
        <div className="bg-white rounded-2xl p-6 shadow-sm animate-fade-in-up">
          <a
            href={item.contentValue}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-primary-700 hover:text-primary-600"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="font-medium">View PDF Document</span>
          </a>
        </div>
      )

    default:
      return null
  }
}

function formatText(text: string): string {
  // Basic markdown-like formatting
  return text
    .replace(/^# (.+)$/gm, '<h1 class="font-serif text-2xl font-semibold mb-4">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="font-serif text-xl font-semibold mb-3">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^(.+)$/gm, '<p class="mb-4 text-gray-700 leading-relaxed">$1</p>')
}

function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}
