import { streamText, stepCountIs } from 'ai'
import { z } from 'zod'
import { model } from '@/lib/ai'
import { SYSTEM_PROMPT } from '@/lib/system-prompt'
import { isAuthenticated } from '@/lib/auth'
import { getEvents, addEvent, updateEvent } from '@/lib/github'

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
    messages,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: {
      list_events: {
        description: 'Busca todos os eventos atuais do site EXIT. Use quando o usuário quer alterar um evento ou ver o que existe.',
        parameters: z.object({
          query: z.string().optional().describe('Filtro opcional por nome do evento'),
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
        description: 'Cria o evento no site EXIT via GitHub. Só chame APÓS o usuário confirmar o preview.',
        parameters: z.object({
          ...eventFields,
          flyerBase64: z.string().optional().describe('Flyer em base64 (sem o prefixo data:image)'),
          flyerExtension: z.string().optional().describe('Extensão do arquivo: webp, jpg, png'),
        }),
        execute: async (params: Record<string, unknown>) => {
          const { flyerBase64, flyerExtension, ...eventData } = params
          const res = await addEvent(eventData, flyerBase64 as string | undefined, flyerExtension as string | undefined)
          return {
            status: res.success ? 'created' : 'error',
            message: res.success
              ? `Evento "${params.name}" criado com sucesso! O site vai atualizar em ~2 minutos.`
              : (res.error ?? 'Erro desconhecido'),
            commitUrl: res.commitUrl ?? null,
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
