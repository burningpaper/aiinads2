interface ThankYouScreenProps {
  title: string
}

export function ThankYouScreen({ title }: ThankYouScreenProps) {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex flex-col p-16">
      {/* Event branding */}
      <div className="text-center text-primary-400 text-lg tracking-widest uppercase">
        ACA AI IN ADVERTISING 2026
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="font-serif text-8xl mb-8 animate-fade-in-up">
            Thank You
          </h1>
          <p className="text-4xl text-primary-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {title}
          </p>
          <p className="text-2xl text-primary-400 mt-8 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            We hope you enjoyed the experience
          </p>
        </div>
      </div>
    </div>
  )
}
