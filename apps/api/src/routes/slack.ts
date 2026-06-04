import { Hono } from 'hono'
import { serviceAuthMiddleware } from '../middleware/auth'
import { db } from '../db'
import { z } from 'zod'

export const slackRoutes = new Hono()

slackRoutes.use('*', serviceAuthMiddleware)

const ConnectSchema = z.object({
  workspaceId: z.string(),
  workspaceName: z.string(),
  botToken: z.string(),
  botUserId: z.string(),
  defaultChannelId: z.string().optional(),
})

/**
 * POST /internal/slack/connect
 * Store (or update) a Slack workspace connection for an org.
 * Called by apps/slack after completing the OAuth flow.
 */
slackRoutes.post('/connect', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const parsed = ConnectSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { workspaceId, workspaceName, botToken, botUserId, defaultChannelId } = parsed.data

  const connection = await db.slackConnection.upsert({
    where: { organizationId: orgId },
    create: { organizationId: orgId, workspaceId, workspaceName, botToken, botUserId, defaultChannelId },
    update: { workspaceId, workspaceName, botToken, botUserId, defaultChannelId },
  })

  return c.json({ ok: true, connectionId: connection.id })
})

const SendSchema = z.object({
  channelId: z.string(),
  text: z.string(),
  /** Optional: thread_ts to reply in a thread */
  threadTs: z.string().optional(),
})

/**
 * POST /internal/slack/send
 * Deliver a message to a Slack channel on behalf of the org's connected workspace.
 * Called by apps/web when an agent replies to a ticket with channel=slack.
 */
slackRoutes.post('/send', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const parsed = SendSchema.safeParse(await c.req.json())
  if (!parsed.success) return c.json({ error: parsed.error.flatten() }, 400)

  const { channelId, text, threadTs } = parsed.data

  const connection = await db.slackConnection.findUnique({ where: { organizationId: orgId } })
  if (!connection) return c.json({ error: 'No Slack connection for this organization' }, 404)

  const { WebClient } = await import('@slack/web-api')
  const slack = new WebClient(connection.botToken)

  try {
    await slack.chat.postMessage({
      channel: channelId,
      text,
      ...(threadTs && { thread_ts: threadTs }),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Slack API error'
    return c.json({ error: message }, 502)
  }

  return c.json({ ok: true })
})
