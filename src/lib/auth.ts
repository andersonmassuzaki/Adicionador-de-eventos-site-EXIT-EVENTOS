import { cookies } from 'next/headers'

const SESSION_COOKIE = 'exit-session'
const SESSION_VALUE = 'authenticated'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export async function login(email: string, password: string): Promise<boolean> {
  const validEmail = process.env.AUTH_EMAIL
  const validPassword = process.env.AUTH_PASSWORD

  if (!validEmail || !validPassword) return false
  if (email.toLowerCase().trim() !== validEmail.toLowerCase().trim()) return false
  if (password !== validPassword) return false

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })

  return true
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get(SESSION_COOKIE)
  return session?.value === SESSION_VALUE
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
