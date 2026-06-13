// @ts-nocheck
import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { z } from 'zod/v3'
import { model } from '@/lib/ai'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { isAuthenticated } from '@/lib/auth'
import { getEvents, updateEvent } from '@/lib/github'
import { createPendingEvent } from '@/lib/supabase'

export const maxDuration = 60

const eventFields = {
  name: z.string().describe('Nome do evento'),
  date: z.string().describe('Data formatada: Sáb 22 Ago · 14h–22h'),
  day: z.string().describe('Dia do mês'),
  month: z.string().describe('Mês abreviado maiúsculo'),
  weekday: z.string().describe('Dia da semana abreviado'),
  sortDate: z.string().describe('Data ISO: 2026-08-22'),
  location: z.string().optional().describe('Local do evento'),
  city: z.string().describe('Cidade'),
  tags: z.array(z.string()).describe('Tags de gênero'),
  moods: z.array(z.string()).describe('Moods para filtro'),
  artists: z.array(z.string()).optional().describe('Artistas'),
  seal: z.string().optional().describe('desconto ou pre-venda'),
  campaign: z.string().describe('Campanha'),
  link: z.string().describe('URL de compra ou a definir'),
  isWhatsApp: z.boolean().optional().describe('true se link é WhatsApp'),
  parentEventId: z.number().optional().describe('ID do evento pai'),
  description: z.string().optional().describe('Descrição longa'),
  featured: z.boolean().optional().describe('Evento destacado'),
  featuredTagline: z.string().optional().describe('Tagline para destaque'),
}

export async function POST(request: Request) {
  const authed = await isAuthenticated()
  if (!authed) {
    return Response.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { messages } = await request.json()

  const result = streamText({
    model,
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: {
      list_events: {
        description: 'Busca todos os eventos atuais do site EXIT.',
        parameters: z.object({
          query: z.string().describe('Filtro por nome ou todos'),
        }),
        execute: async () => {
          try {
            const events = await getEvents()
            const summary = events.map(e => ({
              id: e.id,
              name: e.name,
              date: e.date,
              city: e.city,
              campaign: e.campaign,
              link: e.link ? 'sim' : 'não',
            }))
            return { total: events.length, events: summary, error: null }
          } catch (err) {
            return { total: 0, events: [], error: (err as Error).message }
          }
        },
      },

      preview_event: {
        description: 'Mostra preview do evento. Chame quando tiver nome, data, cidade e gênero.',
        parameters: z.object(eventFields),
        execute: async (params: Record<string, unknown>) => {
          return {
            status: 'preview' as const,
            message: 'Preview montado.',
            event: params,
          }
        },
      },

      create_event: {
        description: 'Salva evento para revisão. Chame após preview ou confirmação.',
        parameters: z.object({
          ...eventFields,
          flyerBase64: z.string().optional().describe('Flyer em base64'),
          flyerExtension: z.string().optional().describe('Extensão: webp, jpg, png'),
        }),
        execute: async (params: Record<string, unknown>) => {
          const { flyerBase64, flyerExtension, ...eventData } = params
          const res = await createPendingEvent(
            eventData,
            flyerBase64 as string | undefined,
            flyerExtension as string | undefined,
          )
          return {
            status: res.success ? 'pending' as const : 'error' as const,
            message: res.success
              ? `Evento "${params.name}" salvo para revisão!`
              : (res.error ?? 'Erro desconhecido'),
            eventId: res.id ?? null,
          }
        },
      },

      update_event: {
        description: 'Altera evento existente no site.',
        parameters: z.object({
          eventId: z.number().describe('ID do evento'),
          changes: z.record(z.string()).describe('Campos a alterar'),
        }),
        execute: async (params: Record<string, unknown>) => {
          const { eventId, changes } = params as { eventId: number; changes: Record<string, string> }
          const res = await updateEvent(eventId, changes)
          return {
            status: res.success ? 'updated' as const : 'error' as const,
            message: res.success
              ? `Evento #${eventId} atualizado!`
              : (res.error ?? 'Erro desconhecido'),
            commitUrl: res.commitUrl ?? null,
          }
        },
      },
    },
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
