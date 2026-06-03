import { z } from 'zod'

export const UpsertCustomerSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
})

export type UpsertCustomerInput = z.infer<typeof UpsertCustomerSchema>
