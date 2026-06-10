'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingEvent } from '@/lib/supabase'

type FilterStatus = 'all' | 'approved' | 'rejected'

export function HistoryPanel() {
  const [events, setEvents] = useState<PendingEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/pending-events')
        if (res.ok) {
          const data: PendingEvent[] = await res.json()
          setEvents(data.filter(e => e.status !== 'pending'))
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = events.filter(e => filter === 'all' || e.status === filter)

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFF9ED]/30" />
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 max-w-3xl mx-auto w-full">
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {(['all', 'approved', 'rejected'] as FilterStatus[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer',
              filter === f
                ? 'bg-white/[0.08] text-[#FFF9ED]'
                : 'text-[#FFF9ED]/40 hover:text-[#FFF9ED]/60'
            )}
          >
            {f === 'all' && 'Todos'}
            {f === 'approved' && 'Aprovados'}
            {f === 'rejected' && 'Rejeitados'}
            <span className="ml-1.5 text-[#FFF9ED]/30">
              {f === 'all' ? events.length : events.filter(e => e.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#FFF9ED]/25 gap-2">
          <p className="text-sm">Nenhum evento no histórico</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(event => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg"
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                event.status === 'approved' ? 'bg-[#D0FC03]/10 text-[#D0FC03]' : 'bg-[#FF4B3E]/10 text-[#FF4B3E]'
              )}>
                {event.status === 'approved' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#FFF9ED]">{event.name}</p>
                <p className="text-xs text-[#FFF9ED]/40 mt-0.5">
                  {event.date} · {event.city} · {event.campaign}
                </p>
                {event.rejection_reason && (
                  <p className="text-xs text-[#FF4B3E]/60 mt-1">Motivo: {event.rejection_reason}</p>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="text-[10px] text-[#FFF9ED]/30">
                  {event.reviewed_at ? new Date(event.reviewed_at).toLocaleDateString('pt-BR') : ''}
                </p>
                {event.commit_url && (
                  <a
                    href={event.commit_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-[#D0FC03]/50 hover:text-[#D0FC03] mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Commit
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
