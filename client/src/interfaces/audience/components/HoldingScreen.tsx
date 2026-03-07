export function HoldingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-6">
      <div className="text-center text-white max-w-md">
        <h1 className="font-serif text-4xl md:text-5xl mb-6">
          AI in Advertising
        </h1>
        <p className="text-primary-300 text-lg mb-8">
          The show will begin shortly. Please keep this page open.
        </p>
        <div className="flex justify-center">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
