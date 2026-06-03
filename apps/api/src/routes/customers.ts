import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import { UpsertCustomerSchema } from '@sparkdesk/shared'

export const customerRoutes = new Hono()

customerRoutes.use('*', serviceAuthMiddleware)

customerRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { q } = c.req.query()

  const customers = await db.customer.findMany({
    where: {
      organizationId: orgId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(customers)
})

customerRoutes.get('/:id/timeline', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const tickets = await db.ticket.findMany({
    where: { customerId: c.req.param('id'), organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: { assignee: true },
  })

  return c.json(tickets)
})

customerRoutes.post('/', zValidator('json', UpsertCustomerSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const customer = await db.customer.upsert({
    where: { organizationId_email: { organizationId: orgId, email: data.email } },
    create: { ...data, organizationId: orgId },
    update: { name: data.name, company: data.company },
  })

  return c.json(customer, 201)
})
