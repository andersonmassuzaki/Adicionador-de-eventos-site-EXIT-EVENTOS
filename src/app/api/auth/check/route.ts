import { isAuthenticated } from '@/lib/auth'

export async function GET() {
  const authed = await isAuthenticated()
  if (!authed) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }
  return Response.json({ authenticated: true })
}
