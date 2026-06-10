import { isAuthenticated } from '@/lib/auth'
import { getPendingEvent, updatePendingEvent } from '@/lib/supabase'
import { addEvent } from '@/lib/github'

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { ids } = await request.json() as { ids: string[] }
  if (!ids || ids.length === 0) {
    return Response.json({ error: 'Nenhum evento selecionado' }, { status: 400 })
  }

  const results: { id: string; name: string; success: boolean; error?: string }[] = []

  for (const id of ids) {
    const event = await getPendingEvent(id)
    if (!event || event.status !== 'pending') {
      results.push({ id, name: event?.name || 'desconhecido', success: false, error: 'Não encontrado ou já processado' })
      continue
    }

    let flyerBase64: string | undefined
    if (event.flyer_url) {
      try {
        const res = await fetch(event.flyer_url)
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          flyerBase64 = Buffer.from(buffer).toString('base64')
        }
      } catch { /* skip */ }
    }

    const eventData: Record<string, unknown> = {
      name: event.name, date: event.date, day: event.day, month: event.month,
      weekday: event.weekday, sortDate: event.sort_date, location: event.location,
      city: event.city, tags: event.tags, moods: event.moods, artists: event.artists,
      seal: event.seal, campaign: event.campaign, link: event.link,
      featured: event.featured, featuredTagline: event.featured_tagline,
      description: event.description,
    }
    if (event.is_whatsapp) eventData.isWhatsApp = true
    if (event.parent_event_id) eventData.parentEventId = event.parent_event_id

    const result = await addEvent(eventData, flyerBase64, event.flyer_extension || undefined)

    if (result.success) {
      await updatePendingEvent(id, {
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        commit_url: result.commitUrl || null,
      })
      results.push({ id, name: event.name, success: true })
    } else {
      results.push({ id, name: event.name, success: false, error: result.error })
    }
  }

  return Response.json({
    total: ids.length,
    approved: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results,
  })
}
