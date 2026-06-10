'use client'

interface EventPreviewProps {
  event: {
    name: string
    date: string
    day: string
    month: string
    weekday: string
    location?: string
    city: string
    tags: string[]
    moods: string[]
    artists?: string[]
    seal?: string
    campaign: string
    link: string
    sortDate: string
    parentEventId?: number
  }
}

export function EventPreview({ event }: EventPreviewProps) {
  return (
    <div className="mt-3 border border-ink-700 bg-ink-800 overflow-hidden max-w-sm">
      {/* Date badge */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-ink-700">
        <div className="text-center min-w-[48px]">
          <div className="text-xs text-cream/40 uppercase">{event.month}</div>
          <div className="text-2xl font-bold text-cream leading-none">{event.day}</div>
          <div className="text-xs text-cream/40">{event.weekday}</div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-cream">{event.name}</h3>
          <p className="text-xs text-cream/50">{event.date}</p>
        </div>
        {event.seal && (
          <span className="px-2 py-0.5 bg-lime text-black text-[10px] font-bold uppercase">
            {event.seal}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 text-xs text-cream/60">
          <span>📍</span>
          <span>{event.location || event.city}</span>
        </div>

        {event.artists && event.artists.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-cream/60">
            <span>🎵</span>
            <span>{event.artists.join(' · ')}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 mt-2">
          {event.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-ink-700 text-cream/50 text-[10px]">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-cream/40 mt-2">
          <span>Campaign:</span>
          <span className="text-cream/60">{event.campaign}</span>
        </div>

        {event.parentEventId && (
          <div className="text-xs text-cream/40">
            Sub-evento (parent: #{event.parentEventId})
          </div>
        )}

        <div className="text-xs text-cream/40 truncate">
          Link: {event.link}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-ink-700 bg-lime/5">
        <p className="text-[10px] text-lime/60 text-center">
          Preview — confirme para publicar no site
        </p>
      </div>
    </div>
  )
}
