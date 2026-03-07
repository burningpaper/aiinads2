export function HoldingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-16">
      <div className="text-center text-white">
        <h1 className="font-serif text-6xl mb-6">
          Panel Discussion
        </h1>
        <p className="text-3xl text-primary-300">
          In Progress
        </p>
        <div className="flex justify-center mt-12">
          <div className="flex gap-2">
            <span className="w-4 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-4 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-4 h-4 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
