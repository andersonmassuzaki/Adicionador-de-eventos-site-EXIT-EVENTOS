'use client'

import { motion } from 'framer-motion'
import { MessageSquare, ClipboardCheck, History } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'chat' | 'review' | 'history'

interface TabsNavProps {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
  pendingCount: number
}

const tabs = [
  { id: 'chat' as TabId, label: 'Chat', icon: MessageSquare },
  { id: 'review' as TabId, label: 'Revisão', icon: ClipboardCheck },
  { id: 'history' as TabId, label: 'Histórico', icon: History },
]

export function TabsNav({ activeTab, onTabChange, pendingCount }: TabsNavProps) {
  return (
    <div className="flex items-center gap-1 bg-white/[0.02] rounded-lg p-1 border border-white/[0.05]">
      {tabs.map(tab => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        return (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
              isActive
                ? 'bg-white/[0.08] text-[#FFF9ED]'
                : 'text-[#FFF9ED]/40 hover:text-[#FFF9ED]/70'
            )}
          >
            <Icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.id === 'review' && pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#D0FC03] text-black text-[10px] font-black rounded-full min-w-[18px] text-center">
                {pendingCount}
              </span>
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
