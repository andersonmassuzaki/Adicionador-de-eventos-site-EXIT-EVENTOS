import { isAuthenticated } from '@/lib/auth'
import { getPendingEvent, updatePendingEvent } from '@/lib/supabase'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id } = await params
  const { reason } = await request.json()

  try {
    const event = await getPendingEvent(id)
    if (!event) {
      return Response.json({ error: 'Evento não encontrado' }, { status: 404 })
    }
    if (event.status !== 'pending') {
      return Response.json({ error: `Evento já está ${event.status}` }, { status: 400 })
    }

    await updatePendingEvent(id, {
      status: 'rejected',
      rejection_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    })

    return Response.json({
      success: true,
      message: `Evento "${event.name}" rejeitado.`,
    })
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
