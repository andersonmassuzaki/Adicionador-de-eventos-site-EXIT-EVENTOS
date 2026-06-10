import { isAuthenticated } from '@/lib/auth'
import { getPendingEvents } from '@/lib/supabase'

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || undefined

  try {
    const events = await getPendingEvents(status)
    return Response.json(events)
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 500 })
  }
}
