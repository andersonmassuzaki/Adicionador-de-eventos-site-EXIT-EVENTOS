import { isAuthenticated } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id, title, status, events_created, created_at, updated_at')
    .order('updated_at', { ascending: false })

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { title, messages } = await request.json()

  const { data, error } = await supabase
    .from('chat_sessions')
    .insert({
      title: title || 'Nova conversa',
      messages: messages || [],
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}
