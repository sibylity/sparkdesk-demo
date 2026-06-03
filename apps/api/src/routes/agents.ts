import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import { UpdateAgentSchema } from '@sparkdesk/shared'

export const agentRoutes = new Hono()

agentRoutes.use('*', serviceAuthMiddleware)

agentRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const agents = await db.agent.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'asc' },
  })

  return c.json(agents)
})

agentRoutes.patch('/:id', zValidator('json', UpdateAgentSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { role } = c.req.valid('json')

  const result = await db.agent.updateMany({
    where: { id: c.req.param('id'), organizationId: orgId },
    data: { role },
  })

  if (result.count === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
