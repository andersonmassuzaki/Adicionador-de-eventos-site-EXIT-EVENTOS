'use client'

import { motion } from 'framer-motion'
import { MapPin, Music, Tag } from 'lucide-react'

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
    featured?: boolean
    featuredTagline?: string
  }
}

export function EventPreview({ event }: EventPreviewProps) {
  return (
    <motion.div
      className="mt-3 backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden max-w-sm"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header — date + name */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/[0.05]">
        <div className="text-center min-w-[48px]">
          <div className="text-[10px] text-[#FFF9ED]/30 uppercase tracking-wider">{event.month}</div>
          <div className="text-2xl font-black text-[#FFF9ED] leading-none">{event.day}</div>
          <div className="text-[10px] text-[#FFF9ED]/30">{event.weekday}</div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#FFF9ED] truncate">{event.name}</h3>
          <p className="text-xs text-[#FFF9ED]/40 mt-0.5">{event.date}</p>
        </div>
        {event.seal && (
          <span className="px-2 py-0.5 bg-[#D0FC03] text-black text-[10px] font-black uppercase rounded-full shrink-0">
            {event.seal}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-[#FFF9ED]/50">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{event.location || event.city}</span>
        </div>

        {event.artists && event.artists.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-[#FFF9ED]/50">
            <Music className="w-3 h-3 shrink-0" />
            <span>{event.artists.join(' · ')}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 mt-2">
          {event.tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-[#FFF9ED]/40 text-[10px] rounded-full"
            >
              <Tag className="w-2.5 h-2.5" />
              {tag}
            </span>
          ))}
        </div>

        <div className="text-xs text-[#FFF9ED]/30">
          Campaign: <span className="text-[#FFF9ED]/50">{event.campaign}</span>
        </div>

        {event.featured && (
          <div className="text-xs text-[#D0FC03]/60">
            ★ Evento destacado
            {event.featuredTagline && <span className="text-[#FFF9ED]/40"> — {event.featuredTagline}</span>}
          </div>
        )}

        {event.parentEventId && (
          <div className="text-xs text-[#FFF9ED]/30">
            Sub-evento (parent: #{event.parentEventId})
          </div>
        )}

        <div className="text-xs text-[#FFF9ED]/25 truncate">
          Link: {event.link}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/[0.05] bg-[#D0FC03]/[0.02]">
        <p className="text-[10px] text-[#D0FC03]/40 text-center font-medium uppercase tracking-wider">
          Preview — confirme para publicar
        </p>
      </div>
    </motion.div>
  )
}
