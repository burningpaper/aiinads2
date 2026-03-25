interface WelcomeScreenProps {
  title: string
}

export function WelcomeScreen({ title }: WelcomeScreenProps) {
  // Generate the audience URL (same origin, root path)
  const audienceUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/`
    : ''

  // QR code API URL (white QR on transparent background)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(audienceUrl)}`

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
            Welcome
          </h1>
          <p className="text-4xl text-primary-300 mb-12 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            {title}
          </p>

          {/* QR Code */}
          <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="inline-block bg-white p-6 rounded-2xl shadow-2xl">
              <img
                src={qrCodeUrl}
                alt="Scan to join"
                className="w-64 h-64"
              />
            </div>
            <p className="text-2xl text-primary-300 mt-6">
              Scan to participate
            </p>
            <p className="text-lg text-primary-400 mt-2 font-mono">
              {audienceUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
