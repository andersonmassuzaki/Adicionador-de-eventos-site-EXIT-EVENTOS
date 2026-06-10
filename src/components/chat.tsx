'use client'

import { useChat } from '@ai-sdk/react'
import { useState, useRef, useEffect } from 'react'
import { EventPreview } from './event-preview'

const ACTION_BUTTONS = [
  { label: 'Adicionar evento', message: 'Quero adicionar um novo evento ao site' },
  { label: 'Alterar evento', message: 'Quero alterar um evento que já está no site' },
]

export function Chat() {
  const { messages, sendMessage, status } = useChat()
  const [input, setInput] = useState('')
  const [showActions, setShowActions] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

    if (toolType === 'tool-create_event' && output) {
      return (
        <div key={i} className="mt-2 px-3 py-2 border border-lime/30 bg-lime/5">
          <p className="text-lime text-sm font-medium">
            {output.status === 'created' ? 'OK ' : 'X '}
            {output.message}
          </p>
        </div>
      )
    }

    if (toolType === 'tool-update_event' && output) {
      return (
        <div key={i} className="mt-2 px-3 py-2 border border-lime/30 bg-lime/5">
          <p className="text-lime text-sm font-medium">
            {output.status === 'updated' ? 'OK ' : 'X '}
            {output.message}
          </p>
        </div>
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
        <div key={i} className="mt-2 flex items-center gap-2 text-cream/40 text-xs">
          <div className="w-3 h-3 border border-cream/40 border-t-transparent rounded-full animate-spin" />
          {labels[toolType] || 'Processando...'}
        </div>
      )
    }

    return null
  }

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-ink-700">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-cream">EXIT</h1>
          <p className="text-xs text-cream/40">Central de Eventos</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-cream/40 hover:text-lime transition-colors cursor-pointer"
        >
          Nova conversa
        </button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {showActions && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-cream mb-1">O que você quer fazer?</h2>
              <p className="text-sm text-cream/40">Escolha uma ação ou digite uma mensagem</p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              {ACTION_BUTTONS.map(btn => (
                <button
                  key={btn.label}
                  onClick={() => handleAction(btn.message)}
                  className="px-6 py-4 border border-ink-700 text-cream hover:border-lime hover:text-lime transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm font-medium">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === 'user'
                  ? 'bg-ink-700 text-cream rounded-none'
                  : 'text-cream/90'
              }`}
            >
              {m.parts?.map((part, i) => {
                if (part.type === 'text') {
                  const text = part.text
                  if (m.role === 'user' && text.includes('flyerBase64:')) {
                    return <span key={i}>{text.split('\n')[0]}</span>
                  }
                  return <span key={i}>{text}</span>
                }
                // Tool parts have type like 'tool-preview_event', 'tool-create_event', etc.
                if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
                  return renderToolPart(part, i)
                }
                return null
              })}
            </div>
          </div>
        ))}

        {isLoading && (messages.length === 0 || messages[messages.length - 1]?.role !== 'assistant') && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 text-cream/40 text-sm">
              <div className="w-3 h-3 border border-cream/40 border-t-transparent rounded-full animate-spin" />
              Pensando...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-ink-700 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 border border-ink-700 text-cream/50 hover:text-lime hover:border-lime transition-colors text-sm cursor-pointer"
            title="Enviar flyer"
          >
            +
          </button>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 px-4 py-2 bg-ink-800 border border-ink-700 text-cream placeholder:text-cream/30 text-sm focus:outline-none focus:border-lime transition-colors rounded-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-lime text-black font-bold text-sm hover:brightness-110 transition-all disabled:opacity-30 rounded-none cursor-pointer"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  )
}
