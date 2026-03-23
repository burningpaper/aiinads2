interface PanelTitleScreenProps {
  title: string
  participants: string | null
}

export function PanelTitleScreen({ title, participants }: PanelTitleScreenProps) {
  // Parse participants - support both newline and comma separation
  const participantList = participants
    ? participants
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter(Boolean)
    : []

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-16">
      <div className="text-center text-white max-w-5xl">
        {/* Panel Title */}
        <h1 className="font-serif text-7xl mb-12 animate-fade-in-up leading-tight">
          {title}
        </h1>

        {/* Participants */}
        {participantList.length > 0 && (
          <div className="animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <p className="text-2xl text-primary-300 mb-8 uppercase tracking-wider">
              Panelists
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {participantList.map((participant, index) => (
                <div
                  key={index}
                  className="bg-white/10 backdrop-blur-sm px-8 py-4 rounded-2xl animate-fade-in-up"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <p className="text-2xl font-medium">{participant}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
