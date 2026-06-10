import { isAuthenticated } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const changes = await request.json()

  const { error } = await supabase
    .from('chat_sessions')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
