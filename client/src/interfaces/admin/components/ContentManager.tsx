import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SegmentContent, ContentType } from '@/types'

interface ContentManagerProps {
  segmentId: string
  content: SegmentContent[]
}

interface UploadResult {
  url: string
  key: string
  contentType: string
}

export function ContentManager({ segmentId, content }: ContentManagerProps) {
  const queryClient = useQueryClient()
  const [isAdding, setIsAdding] = useState(false)
  const [newType, setNewType] = useState<ContentType>('text')
  const [newValue, setNewValue] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sortedContent = [...content].sort((a, b) => a.displayOrder - b.displayOrder)

  const addMutation = useMutation({
    mutationFn: (data: { contentType: ContentType; contentValue: string }) =>
      api.post(`/segments/${segmentId}/content`, {
        ...data,
        displayOrder: content.length + 1,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (contentId: string) => api.delete(`/content/${contentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segment', segmentId] })
    },
  })

  const resetForm = () => {
    setIsAdding(false)
    setNewValue('')
    setSelectedFile(null)
    setIsUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleAdd = async () => {
    // For file uploads (image/pdf)
    if ((newType === 'image' || newType === 'pdf') && selectedFile) {
      setIsUploading(true)
      try {
        const uploadEndpoint = newType === 'image' ? '/uploads/image' : '/uploads/pdf'
        const result = await api.upload<UploadResult>(uploadEndpoint, selectedFile)
        addMutation.mutate({
          contentType: newType,
          contentValue: result.url,
        })
      } catch (error) {
        console.error('Upload failed:', error)
        setIsUploading(false)
        alert('Upload failed. Please try again.')
      }
      return
    }

    // For text/youtube (URL input)
    if (!newValue.trim()) return
    addMutation.mutate({
      contentType: newType,
      contentValue: newValue.trim(),
    })
  }

  const isFileType = newType === 'image' || newType === 'pdf'
  const canSubmit = isFileType ? !!selectedFile : !!newValue.trim()

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
              {item.contentType === 'image' ? (
                <div className="mt-2">
                  <img
                    src={item.contentValue}
                    alt="Content preview"
                    className="max-w-xs max-h-24 rounded object-cover"
                  />
                </div>
              ) : (
                <p className="text-gray-700 mt-1 truncate">
                  {item.contentType === 'text'
                    ? item.contentValue.slice(0, 100) +
                      (item.contentValue.length > 100 ? '...' : '')
                    : item.contentValue}
                </p>
              )}
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
                onChange={(e) => {
                  setNewType(e.target.value as ContentType)
                  setSelectedFile(null)
                  setNewValue('')
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="youtube">YouTube URL</option>
                <option value="pdf">PDF</option>
              </select>
            </div>

            {newType === 'text' && (
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter text content (supports basic markdown)..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              />
            )}

            {newType === 'youtube' && (
              <input
                type="url"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="Enter YouTube URL (e.g., https://youtube.com/watch?v=...)"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
              />
            )}

            {(newType === 'image' || newType === 'pdf') && (
              <div className="mb-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={newType === 'image' ? 'image/*' : 'application/pdf'}
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center justify-center w-full border-2 border-dashed border-gray-300 rounded-lg px-4 py-8 cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-colors"
                >
                  {selectedFile ? (
                    <div className="text-center">
                      <p className="text-gray-700 font-medium">{selectedFile.name}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      <p className="text-primary-600 text-sm mt-2">Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-gray-600 mt-2">
                        Click to upload {newType === 'image' ? 'an image' : 'a PDF'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">Max 10MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                disabled={addMutation.isPending || isUploading || !canSubmit}
                className="bg-primary-600 hover:bg-primary-500 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                {isUploading
                  ? 'Uploading...'
                  : addMutation.isPending
                    ? 'Adding...'
                    : 'Add'}
              </button>
              <button
                onClick={resetForm}
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
