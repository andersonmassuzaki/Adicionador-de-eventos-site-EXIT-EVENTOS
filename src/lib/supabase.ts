import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface PendingEvent {
  id: string
  name: string
  date: string
  day: string
  month: string
  weekday: string
  sort_date: string
  location: string | null
  city: string
  tags: string[]
  moods: string[]
  artists: string[]
  seal: string | null
  campaign: string
  link: string
  is_whatsapp: boolean
  parent_event_id: number | null
  description: string | null
  featured: boolean
  featured_tagline: string | null
  flyer_url: string | null
  flyer_extension: string | null
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  submitted_by: string | null
  reviewed_by: string | null
  created_at: string
  reviewed_at: string | null
  commit_url: string | null
  site_event_id: number | null
}

export async function createPendingEvent(
  eventData: Record<string, unknown>,
  flyerBase64?: string,
  flyerExtension?: string,
  submittedBy?: string
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Generate a temp ID for the flyer path
    const tempId = crypto.randomUUID()
    let flyerUrl: string | null = null

    // Upload flyer to Supabase Storage if provided
    if (flyerBase64 && flyerExtension) {
      const flyerBuffer = Buffer.from(flyerBase64, 'base64')
      const flyerPath = `pending/${tempId}.${flyerExtension}`

      const { error: uploadError } = await supabase.storage
        .from('flyers')
        .upload(flyerPath, flyerBuffer, {
          contentType: `image/${flyerExtension === 'jpg' ? 'jpeg' : flyerExtension}`,
          upsert: true,
        })

      if (uploadError) {
        console.error('Flyer upload error:', uploadError)
      } else {
        const { data: urlData } = supabase.storage.from('flyers').getPublicUrl(flyerPath)
        flyerUrl = urlData.publicUrl
      }
    }

    // Insert into pending_events
    const { data, error } = await supabase
      .from('pending_events')
      .insert({
        name: eventData.name,
        date: eventData.date,
        day: eventData.day,
        month: eventData.month,
        weekday: eventData.weekday,
        sort_date: eventData.sortDate,
        location: eventData.location || null,
        city: eventData.city,
        tags: eventData.tags || [],
        moods: eventData.moods || [],
        artists: eventData.artists || [],
        seal: eventData.seal || null,
        campaign: eventData.campaign,
        link: eventData.link,
        is_whatsapp: eventData.isWhatsApp || false,
        parent_event_id: eventData.parentEventId || null,
        description: eventData.description || null,
        featured: eventData.featured || false,
        featured_tagline: eventData.featuredTagline || null,
        flyer_url: flyerUrl,
        flyer_extension: flyerExtension || null,
        submitted_by: submittedBy || null,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, id: data.id }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function getPendingEvents(status?: string): Promise<PendingEvent[]> {
  let query = supabase
    .from('pending_events')
    .select('*')
    .order('created_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function getPendingEvent(id: string): Promise<PendingEvent | null> {
  const { data, error } = await supabase
    .from('pending_events')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function updatePendingEvent(id: string, changes: Record<string, unknown>) {
  const { error } = await supabase
    .from('pending_events')
    .update(changes)
    .eq('id', id)

  if (error) throw new Error(error.message)
}
