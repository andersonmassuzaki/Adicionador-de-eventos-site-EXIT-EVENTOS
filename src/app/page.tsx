'use client'

import { useState, useEffect } from 'react'
import { Chat } from '@/components/chat'
import { LoginForm } from '@/components/login-form'

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/check').then(r => {
      setAuthenticated(r.ok)
    })
  }, [])

  if (authenticated === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-lime border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />
  }

  return <Chat />
}
