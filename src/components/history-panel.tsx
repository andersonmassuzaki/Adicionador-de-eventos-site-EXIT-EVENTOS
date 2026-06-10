'use client'

import { useState, useEffect } from 'react'
import { Loader2, Check, X, ExternalLink, MessageSquare, Trash2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingEvent } from '@/lib/supabase'

type FilterStatus = 'all' | 'approved' | 'rejected' | 'drafts'

interface ChatSession {
  id: string
  title: string
  status: 'draft' | 'completed'
  events_created: number
  created_at: string
  updated_at: string
}

export function HistoryPanel({ onResumeDraft }: { onResumeDraft?: (sessionId: string) => void }) {
  const [events, setEvents] = useState<PendingEvent[]>([])
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>('all')

  useEffect(() => {
    async function load() {
      try {
        const [eventsRes, sessionsRes] = await Promise.all([
          fetch('/api/pending-events'),
          fetch('/api/chat-sessions'),
        ])
        if (eventsRes.ok) {
          const data: PendingEvent[] = await eventsRes.json()
          setEvents(data.filter(e => e.status !== 'pending'))
        }
        if (sessionsRes.ok) {
          const data: ChatSession[] = await sessionsRes.json()
          setSessions(data)
        }
      } catch { /* ignore */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  async function deleteDraft(id: string) {
    try {
      await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' })
      setSessions(prev => prev.filter(s => s.id !== id))
    } catch { /* ignore */ }
  }

  const drafts = sessions.filter(s => s.status === 'draft')

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
        {(['all', 'drafts', 'approved', 'rejected'] as FilterStatus[]).map(f => (
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
            {f === 'drafts' && 'Rascunhos'}
            {f === 'approved' && 'Aprovados'}
            {f === 'rejected' && 'Rejeitados'}
            <span className="ml-1.5 text-[#FFF9ED]/30">
              {f === 'all' ? events.length + drafts.length : f === 'drafts' ? drafts.length : events.filter(e => e.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Drafts section */}
      {(filter === 'all' || filter === 'drafts') && drafts.length > 0 && (
        <div className="mb-6">
          {filter === 'all' && (
            <h3 className="text-xs text-[#FFF9ED]/30 uppercase tracking-wider font-medium mb-2">Rascunhos</h3>
          )}
          <div className="space-y-2">
            {drafts.map(session => (
              <div
                key={session.id}
                className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.05] rounded-lg group"
              >
                <div className="w-8 h-8 rounded-full bg-[#D0FC03]/5 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-[#D0FC03]/40" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#FFF9ED] truncate">{session.title}</p>
                  <p className="text-xs text-[#FFF9ED]/30 mt-0.5">
                    {new Date(session.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    {session.events_created > 0 && ` · ${session.events_created} evento(s)`}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onResumeDraft && (
                    <button
                      onClick={() => onResumeDraft(session.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#D0FC03]/10 text-[#D0FC03] text-xs font-medium rounded-md hover:bg-[#D0FC03]/20 transition-colors cursor-pointer"
                    >
                      <ArrowRight className="w-3 h-3" />
                      Continuar
                    </button>
                  )}
                  <button
                    onClick={() => deleteDraft(session.id)}
                    className="p-1.5 text-[#FFF9ED]/20 hover:text-[#FF4B3E] transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    title="Excluir rascunho"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events section */}
      {(filter === 'all' || filter === 'approved' || filter === 'rejected') && (
        <div>
          {filter === 'all' && events.length > 0 && (
            <h3 className="text-xs text-[#FFF9ED]/30 uppercase tracking-wider font-medium mb-2">Eventos processados</h3>
          )}
          {events.filter(e => filter === 'all' || e.status === filter).length === 0 ? (
            filter !== 'all' && (
              <div className="flex flex-col items-center justify-center py-20 text-[#FFF9ED]/25 gap-2">
                <p className="text-sm">Nenhum evento {filter === 'approved' ? 'aprovado' : 'rejeitado'}</p>
              </div>
            )
          ) : (
            <div className="space-y-2">
              {events.filter(e => filter === 'all' || e.status === filter).map(event => (
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

          {filter === 'all' && events.length === 0 && drafts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-[#FFF9ED]/25 gap-2">
              <p className="text-sm">Nenhum evento no histórico</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
