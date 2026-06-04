import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { ticketRoutes } from './routes/tickets'
import { customerRoutes } from './routes/customers'
import { agentRoutes } from './routes/agents'
import { settingsRoutes } from './routes/settings'
import { getAnalyticsClient, shutdownAnalytics } from '@sparkdesk/analytics'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.WEB_APP_URL ?? 'http://localhost:3000' }))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/internal/tickets', ticketRoutes)
app.route('/internal/customers', customerRoutes)
app.route('/internal/agents', agentRoutes)
app.route('/internal/settings', settingsRoutes)

app.onError((err, c) => {
  const agentId = c.req.header('X-Agent-Id')
  const orgId = c.req.header('X-Organization-Id')
  const distinctId = agentId ?? orgId ?? 'anonymous'
  getAnalyticsClient()?.captureException(err, distinctId)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT ?? 3001)
serve({ fetch: app.fetch, port }, () => {
  console.log(`API listening on http://localhost:${port}`)
})

const shutdown = async () => {
  await shutdownAnalytics()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
