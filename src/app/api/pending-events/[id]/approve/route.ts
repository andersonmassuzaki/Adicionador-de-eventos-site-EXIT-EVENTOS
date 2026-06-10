import { isAuthenticated } from '@/lib/auth'
import { getPendingEvent, updatePendingEvent } from '@/lib/supabase'
import { addEvent } from '@/lib/github'

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params

  try {
    const event = await getPendingEvent(id)
    if (!event) {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 })
    }
    if (event.status !== 'pending') {
      return Response.json({ error: `Evento já está ${event.status}` }, { status: 400 })
    }

    // Download flyer from Supabase Storage if exists
    let flyerBase64: string | undefined
    if (event.flyer_url) {
      try {
        const res = await fetch(event.flyer_url)
        if (res.ok) {
          const buffer = await res.arrayBuffer()
          flyerBase64 = Buffer.from(buffer).toString('base64')
        }
      } catch {
        console.error('Failed to download flyer from storage')
      }
    }

    // Build event data for GitHub commit
    const eventData: Record<string, unknown> = {
      name: event.name,
      date: event.date,
      day: event.day,
      month: event.month,
      weekday: event.weekday,
      sortDate: event.sort_date,
      location: event.location,
      city: event.city,
      tags: event.tags,
      moods: event.moods,
      artists: event.artists,
      seal: event.seal,
      campaign: event.campaign,
      link: event.link,
      featured: event.featured,
      featuredTagline: event.featured_tagline,
      description: event.description,
    }
    if (event.is_whatsapp) eventData.isWhatsApp = true
    if (event.parent_event_id) eventData.parentEventId = event.parent_event_id

    // Commit to GitHub
    const result = await addEvent(eventData, flyerBase64, event.flyer_extension || undefined)

    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 })
    }

    // Update status in Supabase
    await updatePendingEvent(id, {
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      commit_url: result.commitUrl || null,
    })

    return Response.json({
      success: true,
      commitUrl: result.commitUrl,
      message: `Evento "${event.name}" aprovado e publicado no site.`,
    })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
