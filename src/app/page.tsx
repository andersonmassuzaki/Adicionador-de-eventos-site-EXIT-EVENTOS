'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Chat } from '@/components/chat'
import { LoginForm } from '@/components/login-form'
import { TabsNav, type TabId } from '@/components/tabs-nav'
import { ReviewPanel } from '@/components/review-panel'
import { HistoryPanel } from '@/components/history-panel'

export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('chat')
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    fetch('/api/auth/check').then(r => {
      setAuthenticated(r.ok)
    })
  }, [])

  // Fetch pending count on load and when switching to review tab
  useEffect(() => {
    if (!authenticated) return
    async function fetchCount() {
      try {
        const res = await fetch('/api/pending-events?status=pending')
        if (res.ok) {
          const data = await res.json()
          setPendingCount(data.length)
        }
      } catch { /* ignore */ }
    }
    fetchCount()
  }, [authenticated, activeTab])

  if (authenticated === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-[#D0FC03] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D0FC03]/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D0FC03]/3 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <motion.header
        className="w-full flex items-center justify-between px-6 py-3 relative z-10 border-b border-white/[0.05]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <img src="/assets/logo-cream.png" alt="EXIT" className="h-6" />
          <span className="text-[11px] text-[#FFF9ED]/50 uppercase tracking-widest font-medium border-l border-[#FFF9ED]/15 pl-3 hidden sm:inline">
            Central de Eventos
          </span>
        </div>

        <TabsNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingCount={pendingCount}
        />

        <motion.button
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-xs text-[#FFF9ED]/50 hover:text-[#D0FC03] transition-colors cursor-pointer font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          <span className="hidden sm:inline">Atualizar</span>
        </motion.button>
      </motion.header>

      {/* Content */}
      <div className="flex-1 flex flex-col relative z-10">
        {activeTab === 'chat' && <Chat />}
        {activeTab === 'review' && <ReviewPanel onCountChange={setPendingCount} />}
        {activeTab === 'history' && <HistoryPanel />}
      </div>
    </div>
  )
}
