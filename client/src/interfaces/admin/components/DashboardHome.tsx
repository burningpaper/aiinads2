import { useShowStore } from '@/stores/showStore'
import { Link } from 'react-router-dom'

export function DashboardHome() {
  const { show, segments } = useShowStore()

  const liveSegment = segments.find((s) => s.status === 'live')
  const completedCount = segments.filter((s) => s.status === 'complete').length

  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl text-gray-900 mb-8">{show?.title}</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Show Status</p>
          <p className={`text-2xl font-semibold ${
            show?.status === 'live' ? 'text-green-600' :
            show?.status === 'closed' ? 'text-gray-600' :
            'text-yellow-600'
          }`}>
            {show?.status?.charAt(0).toUpperCase()}{show?.status?.slice(1)}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Current Segment</p>
          <p className="text-2xl font-semibold text-gray-900">
            {liveSegment ? liveSegment.orderIndex : '-'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm mb-1">Progress</p>
          <p className="text-2xl font-semibold text-gray-900">
            {completedCount} / {segments.length}
          </p>
        </div>
      </div>

      {/* Segments Overview */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Segments</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {segments.map((segment) => (
            <Link
              key={segment.id}
              to={`/admin/segment/${segment.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-medium">
                  {segment.orderIndex}
                </span>
                <div>
                  <p className="font-medium text-gray-900">{segment.title}</p>
                  <p className="text-sm text-gray-500">
                    {segment.status === 'live' ? 'Currently live' :
                     segment.status === 'complete' ? 'Completed' :
                     'Not started'}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                segment.status === 'live' ? 'bg-green-100 text-green-700' :
                segment.status === 'complete' ? 'bg-gray-100 text-gray-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {segment.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
