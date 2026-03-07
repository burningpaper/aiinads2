interface WelcomeScreenProps {
  title: string
}

export function WelcomeScreen({ title }: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-16">
      <div className="text-center text-white">
        <h1 className="font-serif text-8xl mb-8 animate-fade-in-up">
          Welcome
        </h1>
        <p className="text-4xl text-primary-300 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          {title}
        </p>
      </div>
    </div>
  )
}
