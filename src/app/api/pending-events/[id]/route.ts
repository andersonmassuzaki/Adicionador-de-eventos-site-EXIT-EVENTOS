import { isAuthenticated } from '@/lib/auth'
import { updatePendingEvent } from '@/lib/supabase'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const changes = await request.json()

  try {
    await updatePendingEvent(id, changes)
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
