'use client'

import { useState } from 'react'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        setError('Email ou senha incorretos')
        return
      }

      onSuccess()
    } catch {
      setError('Erro ao conectar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-cream">EXIT</h1>
          <p className="text-sm text-cream/50 mt-1">Central de Eventos</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-ink-800 border border-ink-700 text-cream placeholder:text-cream/30 rounded-none focus:outline-none focus:border-lime transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-ink-800 border border-ink-700 text-cream placeholder:text-cream/30 rounded-none focus:outline-none focus:border-lime transition-colors"
            />
          </div>

          {error && (
            <p className="text-red text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-lime text-black font-bold tracking-wide hover:brightness-110 transition-all disabled:opacity-50 rounded-none cursor-pointer"
          >
            {loading ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  )
}
