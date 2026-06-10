import { z } from 'zod'

export const eventSchema = z.object({
  name: z.string().describe('Nome do evento'),
  date: z.string().describe('Data formatada: "Sáb 14 Jun · 14h–22h"'),
  day: z.string().describe('Dia do mês: "14"'),
  month: z.string().describe('Mês abreviado maiúsculo: "JUN"'),
  weekday: z.string().describe('Dia da semana: "SÁB"'),
  sortDate: z.string().describe('Data ISO para ordenação: "2026-06-14" ou "2026-06-14b"'),
  location: z.string().optional().describe('Nome do local: "Club 33, SP"'),
  city: z.string().describe('Cidade: "São Paulo"'),
  tags: z.array(z.string()).describe('Tags de gênero/tipo: ["Eletrônica", "Tech House"]'),
  moods: z.array(z.string()).describe('Moods para filtro: ["Eletrônica"]'),
  artists: z.array(z.string()).optional().describe('Artistas do lineup'),
  seal: z.string().optional().describe('"desconto" ou "pre-venda"'),
  campaign: z.string().describe('Campanha: "Festas Eletrônicas"'),
  link: z.string().describe('URL de compra ou WhatsApp'),
  isWhatsApp: z.boolean().optional().describe('true se link é de WhatsApp'),
  parentEventId: z.number().optional().describe('ID do evento pai (ex: 28 para Nossa Casa)'),
  description: z.string().optional().describe('Descrição longa do evento'),
})

export type EventData = z.infer<typeof eventSchema>

export const updateEventSchema = z.object({
  eventId: z.number().describe('ID do evento a alterar'),
  changes: z.record(z.string(), z.unknown()).describe('Campos a alterar com novos valores'),
})
