import type { App } from '@slack/bolt'
import type { SparkDeskClient } from '../client'
import { trackTicketReplySynced } from '../analytics/events'

const ORG_ID = process.env.DEMO_ORG_ID ?? ''

/**
 * Register the outbound reply handler.
 *
 * Outbound flow: SparkDesk agent replies to a ticket →
 *   apps/api calls POST /internal/slack/send →
 *   Slack WebClient (in apps/api/src/routes/slack.ts) delivers the message.
 *
 * This handler listens for app_mention events — when an agent @mentions
 * the bot in a thread, the bot replies with helpful context. It also fires
 * the outbound tracking event so Voltage sees the event in apps/slack context.
 */
export function registerReplyHandlers(app: App, _client: SparkDeskClient): void {
  app.event('app_mention', async ({ event, say, logger }) => {
    try {
      const ev = event as { text?: string; ts: string; channel: string }
      const text = ev.text ?? ''
      const isStatusRequest = text.toLowerCase().includes('status')

      if (isStatusRequest) {
        await say({
          text: "I'll pull up the ticket status for you shortly.",
          thread_ts: ev.ts,
        })
      }

      trackTicketReplySynced({
        orgId: ORG_ID,
        ticketId: `slack-mention:${ev.ts}`,
        slackChannelId: ev.channel,
        agentId: 'slack-bot',
      })
    } catch (err) {
      logger.error('Failed to handle app_mention', err)
    }
  })
}
