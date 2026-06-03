import { z } from 'zod'

export const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  channel: z.enum(['web', 'api', 'slack', 'email']).default('web'),
  customerId: z.string(),
  assigneeId: z.string().optional(),
})

export const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'snoozed', 'spam']).optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  assigneeId: z.string().nullable().optional(),
  snoozedUntil: z.string().datetime().optional(),
})

export const ReplyTicketSchema = z.object({
  body: z.string().min(1),
})

export const AddNoteSchema = z.object({
  body: z.string().min(1),
})

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>
export type ReplyTicketInput = z.infer<typeof ReplyTicketSchema>
export type AddNoteInput = z.infer<typeof AddNoteSchema>
