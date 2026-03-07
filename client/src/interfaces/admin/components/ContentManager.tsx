import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SegmentContent, ContentType } from '@/types'

interface ContentManagerProps {
  segmentId: string
  content: SegmentContent[]
}

export function ContentManager({ segmentId, content }: ContentManagerProps) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newType, setNewType] = useState<ContentType>('text')
  const [newValue, setNewValue] = useState('')

  const sortedContent = [...content].sort((a, b) => a.displayOrder - b.displayOrder)

  const addMutation = useMutation({
    mutationFn: (data: { contentType: ContentType; contentValue: string }) =>
      api.post(`/segments/${segmentId}/content`, {
        ...data,
        displayOrder: content.length + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      setIsAdding(false)
      setNewValue('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (contentId: string) =>
      api.delete(`/content/${contentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
    },
  })

  const handleAdd = () => {
    if (!newValue.trim()) return
    addMutation.mutate({
      contentType: newType,
      contentValue: newValue.trim(),
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Content</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          + Add Content
        </button>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedContent.map((item) => (
          <div key={item.id} className="px-6 py-4 flex items-start gap-4">
            <span className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
              {item.displayOrder}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium text-gray-400 uppercase">
                {item.contentType}
              </span>
              <p className="text-gray-700 mt-1 truncate">
                {item.contentType === 'text'
                  ? item.contentValue.slice(0, 100) + (item.contentValue.length > 100 ? '...' : '')
                  : item.contentValue}
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Delete this content?')) {
                  deleteMutation.mutate(item.id)
                }
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Delete
            </button>
          </div>
        ))}

        {sortedContent.length === 0 && !isAdding && (
          <div className="px-6 py-8 text-center text-gray-500">
            No content yet. Click "Add Content" to get started.
          </div>
        )}

        {isAdding && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex gap-4 mb-4">
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as ContentType)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="image">Image URL</option>
                <option value="youtube">YouTube URL</option>
                <option value="pdf">PDF URL</option>
              </select>
            </div>

            {newType === 'text' ? (
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter text content (supports basic markdown)..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              />
            ) : (
              <input
                type="url"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Enter ${newType} URL...`}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={addMutation.isPending || !newValue.trim()}
                className="bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {addMutation.isPending ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setIsAdding(false)
                  setNewValue('')
                }}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
