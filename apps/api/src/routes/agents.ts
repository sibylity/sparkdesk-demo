import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import { UpdateAgentSchema } from '@sparkdesk/shared'
import { capture } from '@sparkdesk/analytics'

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

  capture('agent_role_updated', {
    distinctId: orgId,
    orgId,
    agentId: c.req.param('id'),
    role,
  })

  return c.json({ ok: true })
})

// Dismiss a feature tip for an agent
agentRoutes.post('/:id/dismiss-tip', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const body = await c.req.json<{ tipId?: string }>()
  if (!body.tipId) return c.json({ error: 'Missing tipId' }, 400)

  const agent = await db.agent.findFirst({
    where: { id: c.req.param('id'), organizationId: orgId },
  })
  if (!agent) return c.json({ error: 'Not found' }, 404)

  if (!agent.dismissedTips.includes(body.tipId)) {
    await db.agent.update({
      where: { id: c.req.param('id') },
      data: { dismissedTips: { push: body.tipId } },
    })
  }

  return c.json({ ok: true })
})
