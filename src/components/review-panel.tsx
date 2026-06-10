'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Loader2, CheckCheck, ClipboardCheck, MapPin, Music, Calendar, ExternalLink, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PendingEvent } from '@/lib/supabase'

export function ReviewPanel({ onCountChange }: { onCountChange: (count: number) => void }) {
  const [events, setEvents] = useState<PendingEvent[]>([])
  const [selected, setSelected] = useState<PendingEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchLoading, setBatchLoading] = useState(false)

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/pending-events?status=pending')
      if (res.ok) {
        const data = await res.json()
        setEvents(data)
        onCountChange(data.length)
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [onCountChange])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  async function handleApprove(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/pending-events/${id}/approve`, { method: 'POST' })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        if (selected?.id === id) setSelected(null)
        onCountChange(events.length - 1)
      }
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  async function handleReject(id: string) {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/pending-events/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        if (selected?.id === id) setSelected(null)
        setShowRejectInput(false)
        setRejectReason('')
        onCountChange(events.length - 1)
      }
    } catch { /* ignore */ }
    finally { setActionLoading(null) }
  }

  async function handleBatchApprove() {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    try {
      const res = await fetch('/api/pending-events/approve-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      })
      if (res.ok) {
        await fetchEvents()
        setSelectedIds(new Set())
        setSelected(null)
      }
    } catch { /* ignore */ }
    finally { setBatchLoading(false) }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#FFF9ED]/30" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#FFF9ED]/40 gap-2">
        <CheckCheck className="w-8 h-8" />
        <p className="text-sm font-medium">Nenhum evento pendente</p>
        <p className="text-xs text-[#FFF9ED]/25">Todos os eventos foram revisados</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex gap-4 overflow-hidden px-6 py-4">
      {/* List */}
      <div className="w-80 shrink-0 flex flex-col gap-2 overflow-y-auto">
        {/* Batch actions */}
        {selectedIds.size > 0 && (
          <motion.div
            className="flex items-center gap-2 p-2 bg-[#D0FC03]/10 border border-[#D0FC03]/20 rounded-lg mb-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-xs text-[#D0FC03] font-medium">{selectedIds.size} selecionados</span>
            <motion.button
              onClick={handleBatchApprove}
              disabled={batchLoading}
              whileTap={{ scale: 0.95 }}
              className="ml-auto px-3 py-1 bg-[#D0FC03] text-black text-xs font-bold rounded cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {batchLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Aprovar todos
            </motion.button>
          </motion.div>
        )}

        {events.map(event => (
          <motion.div
            key={event.id}
            onClick={() => setSelected(event)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
              selected?.id === event.id
                ? 'bg-white/[0.06] border-[#D0FC03]/20'
                : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
            )}
          >
            <input
              type="checkbox"
              checked={selectedIds.has(event.id)}
              onChange={(e) => { e.stopPropagation(); toggleSelect(event.id) }}
              className="accent-[#D0FC03] cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#FFF9ED] truncate">{event.name}</p>
              <p className="text-xs text-[#FFF9ED]/40 mt-0.5">{event.date} · {event.city}</p>
            </div>
            <div className="text-center shrink-0">
              <div className="text-[10px] text-[#FFF9ED]/30 uppercase">{event.month}</div>
              <div className="text-lg font-black text-[#FFF9ED] leading-none">{event.day}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Detail */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="backdrop-blur-xl bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden"
            >
              {/* Flyer */}
              {selected.flyer_url ? (
                <div className="aspect-[4/5] max-h-72 bg-white/[0.03] flex items-center justify-center overflow-hidden">
                  <img src={selected.flyer_url} alt={selected.name} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="h-32 bg-white/[0.03] flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[#FFF9ED]/15" />
                </div>
              )}

              {/* Info */}
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-[#FFF9ED]">{selected.name}</h3>
                  {selected.seal && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-[#D0FC03] text-black text-[10px] font-black uppercase rounded-full">
                      {selected.seal}
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#FFF9ED]/60">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{selected.date}</span>
                    <span className="text-[#FFF9ED]/30">({selected.weekday})</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#FFF9ED]/60">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>{selected.location || selected.city}</span>
                  </div>
                  {selected.artists.length > 0 && (
                    <div className="flex items-center gap-2 text-[#FFF9ED]/60">
                      <Music className="w-4 h-4 shrink-0" />
                      <span>{selected.artists.join(' · ')}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[#FFF9ED]/60">
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <a href={selected.link} target="_blank" rel="noopener noreferrer" className="truncate hover:text-[#D0FC03] transition-colors">
                      {selected.link}
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-white/[0.04] border border-white/[0.06] text-[#FFF9ED]/50 text-[11px] rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="text-xs text-[#FFF9ED]/30 space-y-1">
                  <div>Campaign: <span className="text-[#FFF9ED]/50">{selected.campaign}</span></div>
                  <div>Sort date: <span className="text-[#FFF9ED]/50">{selected.sort_date}</span></div>
                  {selected.featured && <div className="text-[#D0FC03]/60">★ Evento destacado — {selected.featured_tagline}</div>}
                  {selected.parent_event_id && <div>Sub-evento (parent: #{selected.parent_event_id})</div>}
                  {selected.description && <div className="mt-2 text-[#FFF9ED]/40 text-xs whitespace-pre-wrap">{selected.description}</div>}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/[0.05]">
                  <motion.button
                    onClick={() => handleApprove(selected.id)}
                    disabled={actionLoading === selected.id}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#D0FC03] text-black font-bold text-sm rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === selected.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Aprovar
                  </motion.button>
                  <motion.button
                    onClick={() => setShowRejectInput(true)}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-3 border border-[#FF4B3E]/30 text-[#FF4B3E] font-medium text-sm rounded-lg cursor-pointer hover:bg-[#FF4B3E]/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Reject input */}
                <AnimatePresence>
                  {showRejectInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <input
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        placeholder="Motivo da rejeição (opcional)"
                        className="w-full px-3 py-2 bg-white/[0.03] border border-[#FF4B3E]/20 text-[#FFF9ED] text-sm rounded-lg focus:outline-none focus:border-[#FF4B3E]/40 placeholder:text-[#FFF9ED]/25"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReject(selected.id)}
                          disabled={actionLoading === selected.id}
                          className="flex-1 py-2 bg-[#FF4B3E] text-white font-bold text-sm rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          Confirmar rejeição
                        </button>
                        <button
                          onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                          className="px-4 py-2 text-[#FFF9ED]/40 text-sm cursor-pointer hover:text-[#FFF9ED]/60"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center h-full text-[#FFF9ED]/25 gap-2 min-h-[400px]"
            >
              <ClipboardCheck className="w-8 h-8" />
              <p className="text-sm">Selecione um evento para revisar</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
