import { streamText, stepCountIs, convertToModelMessages, jsonSchema } from 'ai'
import { model } from '@/lib/ai'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { isAuthenticated } from '@/lib/auth'
import { getEvents, updateEvent } from '@/lib/github'
import { createPendingEvent } from '@/lib/supabase'

export const maxDuration = 60

const eventJsonSchema = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', description: 'Nome do evento' },
    date: { type: 'string', description: 'Data formatada: "Sáb 22 Ago · 14h–22h"' },
    day: { type: 'string', description: 'Dia do mês: "22"' },
    month: { type: 'string', description: 'Mês abreviado: "AGO"' },
    weekday: { type: 'string', description: 'Dia da semana: "SÁB"' },
    sortDate: { type: 'string', description: 'Data ISO: "2026-08-22"' },
    location: { type: 'string', description: 'Local do evento (opcional)' },
    city: { type: 'string', description: 'Cidade' },
    tags: { type: 'array', items: { type: 'string' }, description: 'Tags de gênero' },
    moods: { type: 'array', items: { type: 'string' }, description: 'Moods para filtro' },
    artists: { type: 'array', items: { type: 'string' }, description: 'Artistas' },
    seal: { type: 'string', description: '"desconto" ou "pre-venda"' },
    campaign: { type: 'string', description: 'Campanha' },
    link: { type: 'string', description: 'URL de compra ou "a definir"' },
    isWhatsApp: { type: 'boolean', description: 'true se link é WhatsApp' },
    parentEventId: { type: 'number', description: 'ID do evento pai' },
    description: { type: 'string', description: 'Descrição longa' },
    featured: { type: 'boolean', description: 'Evento destacado' },
    featuredTagline: { type: 'string', description: 'Tagline para destaque' },
  },
  required: ['name', 'date', 'day', 'month', 'weekday', 'sortDate', 'city', 'tags', 'moods', 'campaign', 'link'],
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: {
      list_events: {
        description: 'Busca todos os eventos atuais do site EXIT.',
        parameters: jsonSchema({
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Filtro por nome ou "todos"' },
          },
          required: ['query'],
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
        parameters: jsonSchema(eventJsonSchema),
        execute: async (params: Record<string, unknown>) => {
          return {
            status: 'preview',
            message: 'Preview montado.',
            event: params,
          }
        },
      },

      create_event: {
        description: 'Salva evento para revisão. Chame após preview ou quando o usuário confirmar.',
        parameters: jsonSchema({
          ...eventJsonSchema,
          properties: {
            ...eventJsonSchema.properties,
            flyerBase64: { type: 'string', description: 'Flyer em base64' },
            flyerExtension: { type: 'string', description: 'Extensão: webp, jpg, png' },
          },
        }),
        execute: async (params: Record<string, unknown>) => {
          const { flyerBase64, flyerExtension, ...eventData } = params
          const res = await createPendingEvent(
            eventData,
            flyerBase64 as string | undefined,
            flyerExtension as string | undefined,
          )
          return {
            status: res.success ? 'pending' : 'error',
            message: res.success
              ? `Evento "${params.name}" salvo para revisão!`
              : (res.error ?? 'Erro desconhecido'),
            eventId: res.id ?? null,
          }
        },
      },

      update_event: {
        description: 'Altera evento existente no site.',
        parameters: jsonSchema({
          type: 'object',
          properties: {
            eventId: { type: 'number', description: 'ID do evento' },
            changes: { type: 'object', description: 'Campos a alterar', additionalProperties: { type: 'string' } },
          },
          required: ['eventId', 'changes'],
        }),
        execute: async (params: Record<string, unknown>) => {
          const { eventId, changes } = params as { eventId: number; changes: Record<string, string> }
          const res = await updateEvent(eventId, changes)
          return {
            status: res.success ? 'updated' : 'error',
            message: res.success
              ? `Evento #${eventId} atualizado!`
              : (res.error ?? 'Erro desconhecido'),
            commitUrl: res.commitUrl ?? null,
          }
        },
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any,
    stopWhen: stepCountIs(5),
  })

  return result.toUIMessageStreamResponse()
}
