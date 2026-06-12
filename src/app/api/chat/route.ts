import { streamText, stepCountIs, convertToModelMessages, jsonSchema } from 'ai'
import { z } from 'zod'
import { model } from '@/lib/ai'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { isAuthenticated } from '@/lib/auth'
import { getEvents, updateEvent } from '@/lib/github'
import { createPendingEvent } from '@/lib/supabase'

export const maxDuration = 60

const eventFields = {
  name: z.string(),
  date: z.string(),
  day: z.string(),
  month: z.string(),
  weekday: z.string(),
  sortDate: z.string(),
  location: z.string().optional(),
  city: z.string(),
  tags: z.array(z.string()),
  moods: z.array(z.string()),
  artists: z.array(z.string()).optional(),
  seal: z.string().optional(),
  campaign: z.string(),
  link: z.string(),
  isWhatsApp: z.boolean().optional(),
  parentEventId: z.number().optional(),
  description: z.string().optional(),
  featured: z.boolean().optional(),
  featuredTagline: z.string().optional().describe('Tagline curta para eventos destacados'),
} as const

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
        description: 'Busca todos os eventos atuais do site EXIT. Use quando o usuário quer alterar um evento ou ver o que existe.',
        parameters: jsonSchema({
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Filtro por nome do evento, ou "todos" para listar tudo' },
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
        description: 'Mostra um preview do evento antes de confirmar a criação. Chame após coletar todos os dados obrigatórios.',
        parameters: z.object(eventFields),
        execute: async (params: z.infer<ReturnType<typeof z.object<typeof eventFields>>>) => {
          return {
            status: 'preview',
            message: 'Preview montado. Peça confirmação ao usuário antes de criar.',
            event: params,
          }
        },
      },

      create_event: {
        description: 'Salva o evento para revisão. Só chame APÓS o usuário confirmar o preview. O evento NÃO vai direto pro site — fica aguardando aprovação.',
        parameters: z.object({
          ...eventFields,
          flyerBase64: z.string().optional().describe('Flyer em base64 (sem o prefixo data:image)'),
          flyerExtension: z.string().optional().describe('Extensão do arquivo: webp, jpg, png'),
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
              ? `Evento "${params.name}" salvo para revisão! Vai aparecer na aba Revisão aguardando aprovação.`
              : (res.error ?? 'Erro desconhecido'),
            eventId: res.id ?? null,
          }
        },
      },

      update_event: {
        description: 'Altera um evento existente no site EXIT. Só chame APÓS confirmação do usuário.',
        parameters: z.object({
          eventId: z.number().describe('ID do evento a alterar'),
          changes: z.record(z.string(), z.string()).describe('Campos alterados com novos valores'),
        }),
        execute: async ({ eventId, changes }: { eventId: number; changes: Record<string, string> }) => {
          const res = await updateEvent(eventId, changes)
          return {
            status: res.success ? 'updated' : 'error',
            message: res.success
              ? `Evento #${eventId} atualizado! O site vai atualizar em ~2 minutos.`
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
