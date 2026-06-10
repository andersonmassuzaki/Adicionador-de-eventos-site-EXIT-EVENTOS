'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { LogIn, LoaderIcon } from 'lucide-react'

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D0FC03]/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#D0FC03]/3 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>

      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="text-center mb-10">
          <motion.div
            className="flex justify-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <img src="/assets/logo-cream.png" alt="EXIT Eventos" className="h-8" />
          </motion.div>
          <motion.p
            className="text-[13px] text-[#FFF9ED]/30 mt-3 tracking-widest uppercase font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Central de Eventos
          </motion.p>
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-[#D0FC03]/20 to-transparent mt-4"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-4 backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] p-6 shadow-2xl"
          initial={{ scale: 0.98 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] text-[#FFF9ED] placeholder:text-[#FFF9ED]/20 rounded-lg focus:outline-none focus:border-[#D0FC03]/40 transition-all text-sm"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] text-[#FFF9ED] placeholder:text-[#FFF9ED]/20 rounded-lg focus:outline-none focus:border-[#D0FC03]/40 transition-all text-sm"
            />
          </div>

          {error && (
            <motion.p
              className="text-[#FF4B3E] text-sm text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 bg-[#D0FC03] text-black font-bold tracking-wide rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            {loading ? (
              <LoaderIcon className="w-4 h-4 animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            {loading ? 'Entrando...' : 'ENTRAR'}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}
