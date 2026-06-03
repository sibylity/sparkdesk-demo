import { z } from 'zod'

export const UpdateAgentSchema = z.object({
  role: z.enum(['admin', 'agent']),
})

export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>
