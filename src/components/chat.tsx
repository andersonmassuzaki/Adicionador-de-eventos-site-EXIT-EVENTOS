'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SendIcon,
  LoaderIcon,
  PlusIcon,
  Paperclip,
  CalendarPlus,
  Pencil,
  RotateCcw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { EventPreview } from './event-preview'

const ACTION_BUTTONS = [
  {
    icon: <CalendarPlus className="w-4 h-4" />,
    label: 'Adicionar evento',
    message: 'Quero adicionar um novo evento ao site',
  },
  {
    icon: <Pencil className="w-4 h-4" />,
    label: 'Alterar evento',
    message: 'Quero alterar um evento que já está no site',
  },
]

function useAutoResizeTextarea({ minHeight, maxHeight }: { minHeight: number; maxHeight?: number }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current
      if (!textarea) return
      if (reset) {
        textarea.style.height = `${minHeight}px`
        return
      }
      textarea.style.height = `${minHeight}px`
      const newHeight = Math.max(minHeight, Math.min(textarea.scrollHeight, maxHeight ?? Infinity))
      textarea.style.height = `${newHeight}px`
    },
    [minHeight, maxHeight]
  )

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) textarea.style.height = `${minHeight}px`
  }, [minHeight])

  return { textareaRef, adjustHeight }
}

function TypingDots() {
  return (
    <div className="flex items-center ml-1">
      {[1, 2, 3].map(dot => (
        <motion.div
          key={dot}
          className="w-1.5 h-1.5 bg-[#D0FC03] rounded-full mx-0.5"
          initial={{ opacity: 0.3 }}
          animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

export function Chat() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const [showActions, setShowActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 44, maxHeight: 160 })

  const isLoading = status === 'submitted' || status === 'streaming'

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleAction(message: string) {
    setShowActions(false)
    sendMessage({ text: message })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    setShowActions(false)
    sendMessage({ text: input })
    setInput('')
    adjustHeight(true)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (input.trim() && !isLoading) {
        handleSubmit(e)
      }
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      const ext = file.name.split('.').pop() || 'png'
      sendMessage({
        text: `[Flyer enviado: ${file.name}]\n\nDados do arquivo para uso interno:\nflyerBase64: ${base64}\nflyerExtension: ${ext}`,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderToolPart(part: any, i: number) {
    const toolType = part.type as string
    const isResult = part.state === 'result'
    const output = isResult ? part.output : null

    if (toolType === 'tool-preview_event' && output?.event) {
      return <EventPreview key={i} event={output.event} />
    }

    if ((toolType === 'tool-create_event' || toolType === 'tool-update_event') && output) {
      const success = output.status === 'created' || output.status === 'updated'
      return (
        <motion.div
          key={i}
          className={cn(
            'mt-3 px-4 py-3 rounded-lg border',
            success ? 'border-[#D0FC03]/20 bg-[#D0FC03]/5' : 'border-[#FF4B3E]/20 bg-[#FF4B3E]/5'
          )}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className={cn('text-sm font-medium', success ? 'text-[#D0FC03]' : 'text-[#FF4B3E]')}>
            {success ? '✓ ' : '✗ '}
            {output.message}
          </p>
        </motion.div>
      )
    }

    if (!isResult) {
      const labels: Record<string, string> = {
        'tool-list_events': 'Buscando eventos...',
        'tool-preview_event': 'Montando preview...',
        'tool-create_event': 'Criando evento no site...',
        'tool-update_event': 'Atualizando evento...',
      }
      return (
        <div key={i} className="mt-2 flex items-center gap-2 text-[#FFF9ED]/30 text-xs">
          <LoaderIcon className="w-3 h-3 animate-spin" />
          {labels[toolType] || 'Processando...'}
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen flex flex-col w-full items-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#D0FC03]/5 rounded-full mix-blend-normal filter blur-[128px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#D0FC03]/3 rounded-full mix-blend-normal filter blur-[128px] animate-pulse delay-700" />
      </div>

      {/* Header */}
      <motion.header
        className="w-full max-w-2xl mx-auto flex items-center justify-between px-6 py-4 relative z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3">
          <img src="/assets/logo-cream.png" alt="EXIT" className="h-6" />
          <span className="text-[11px] text-[#FFF9ED]/50 uppercase tracking-widest font-medium border-l border-[#FFF9ED]/15 pl-3">Central de Eventos</span>
        </div>
        <motion.button
          onClick={() => window.location.reload()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-1.5 text-xs text-[#FFF9ED]/50 hover:text-[#D0FC03] transition-colors cursor-pointer font-medium"
        >
          <RotateCcw className="w-3 h-3" />
          Nova conversa
        </motion.button>
      </motion.header>

      {/* Messages area */}
      <div className="flex-1 w-full max-w-2xl mx-auto overflow-y-auto px-6 py-4 relative z-10">
        {/* Welcome screen */}
        <AnimatePresence>
          {showActions && messages.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center min-h-[60vh] space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center space-y-3">
                <motion.h2
                  className="text-2xl font-bold tracking-tight text-[#FFF9ED]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  O que você quer fazer?
                </motion.h2>
                <motion.p
                  className="text-sm text-[#FFF9ED]/60 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Escolha uma ação ou digite uma mensagem
                </motion.p>
                <motion.div
                  className="h-px bg-gradient-to-r from-transparent via-[#D0FC03]/15 to-transparent"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: '100%', opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.8 }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {ACTION_BUTTONS.map((btn, index) => (
                  <motion.button
                    key={btn.label}
                    onClick={() => handleAction(btn.message)}
                    className="flex items-center gap-3 px-5 py-4 backdrop-blur-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-[#D0FC03]/30 rounded-xl text-[#FFF9ED]/80 hover:text-[#D0FC03] transition-all cursor-pointer group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-[#FFF9ED]/40 group-hover:text-[#D0FC03] transition-colors">
                      {btn.icon}
                    </div>
                    <span className="text-sm font-semibold">{btn.label}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        {messages.map((m, msgIndex) => (
          <motion.div
            key={m.id}
            className={cn('flex mb-4', m.role === 'user' ? 'justify-end' : 'justify-start')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: msgIndex === messages.length - 1 ? 0.1 : 0 }}
          >
            <div
              className={cn(
                'max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap',
                m.role === 'user'
                  ? 'backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl rounded-br-sm px-4 py-3 text-[#FFF9ED]'
                  : 'text-[#FFF9ED]/95 px-1 py-1'
              )}
            >
              {m.parts?.map((part, i) => {
                if (part.type === 'text') {
                  const text = part.text
                  if (m.role === 'user' && text.includes('flyerBase64:')) {
                    return (
                      <span key={i} className="flex items-center gap-2">
                        <Paperclip className="w-3 h-3 text-[#D0FC03]/60" />
                        {text.split('\n')[0]}
                      </span>
                    )
                  }
                  return <span key={i}>{text}</span>
                }
                if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
                  return renderToolPart(part, i)
                }
                return null
              })}
            </div>
          </motion.div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="w-full max-w-2xl mx-auto px-6 pb-2 relative z-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <div className="flex items-center gap-2 text-sm text-[#FFF9ED]/60 font-medium">
              <div className="w-6 h-6 rounded-full bg-[#D0FC03]/10 flex items-center justify-center">
                <span className="text-[8px] font-black text-[#D0FC03]">E</span>
              </div>
              <span>Pensando</span>
              <TypingDots />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <motion.div
        className="w-full max-w-2xl mx-auto px-6 pb-6 pt-2 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="backdrop-blur-2xl bg-white/[0.02] rounded-2xl border border-white/[0.05] shadow-2xl overflow-hidden">
          <form onSubmit={handleSubmit}>
            <div className="p-3">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value)
                  adjustHeight()
                }}
                onKeyDown={handleKeyDown}
                placeholder="Digite uma mensagem..."
                disabled={isLoading}
                className={cn(
                  'w-full px-3 py-2 resize-none bg-transparent border-none text-[#FFF9ED] text-sm font-normal',
                  'focus:outline-none placeholder:text-[#FFF9ED]/40 disabled:opacity-50'
                )}
                style={{ overflow: 'hidden' }}
              />
            </div>

            <div className="px-3 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-[#FFF9ED]/50 hover:text-[#D0FC03] rounded-lg transition-colors cursor-pointer"
                  title="Enviar flyer"
                >
                  <Paperclip className="w-4 h-4" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => {
                    if (!isLoading) {
                      setShowActions(true)
                      setInput('')
                    }
                  }}
                  whileTap={{ scale: 0.94 }}
                  className="p-2 text-[#FFF9ED]/50 hover:text-[#D0FC03] rounded-lg transition-colors cursor-pointer"
                  title="Ações"
                >
                  <PlusIcon className="w-4 h-4" />
                </motion.button>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading || !input.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 cursor-pointer',
                  input.trim()
                    ? 'bg-[#D0FC03] text-black shadow-lg shadow-[#D0FC03]/10'
                    : 'bg-white/[0.05] text-[#FFF9ED]/35'
                )}
              >
                {isLoading ? (
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon className="w-4 h-4" />
                )}
                <span>Enviar</span>
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
