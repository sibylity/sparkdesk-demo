import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { ticketRoutes } from './routes/tickets'
import { customerRoutes } from './routes/customers'
import { agentRoutes } from './routes/agents'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.WEB_APP_URL ?? 'http://localhost:3000' }))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/internal/tickets', ticketRoutes)
app.route('/internal/customers', customerRoutes)
app.route('/internal/agents', agentRoutes)

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch,
}
