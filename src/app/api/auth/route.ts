import { login, logout } from '@/lib/auth'

export async function POST(request: Request) {
  const { email, password } = await request.json()

  const success = await login(email, password)
  if (!success) {
    return Response.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  return Response.json({ success: true })
}

export async function DELETE() {
  await logout()
  return Response.json({ success: true })
}
