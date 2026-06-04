import type { App } from '@slack/bolt'
import { types } from '@slack/bolt'
import type { SparkDeskClient } from '../client'
import { trackSlackMessageReceived, trackSlackReplyReceived } from '../analytics/events'

type GenericMessageEvent = types.GenericMessageEvent

const ORG_ID = process.env.DEMO_ORG_ID ?? ''

/**
 * Register message event handlers on the Bolt app.
 *
 * Inbound flow: customer sends a message in a Slack channel →
 *   1. Upsert customer in SparkDesk by Slack user ID
 *   2. Create a new ticket (or find open one) for this channel conversation
 *   3. Track the event
 *
 * Bidirectional flow: thread reply in a ticket channel →
 *   1. Check if the thread maps to a SparkDesk ticket
 *   2. Sync the reply back to the ticket thread
 *   3. Track the event
 */
export function registerMessageHandlers(app: App, client: SparkDeskClient): void {
  // Handle new top-level messages (not bot messages, not thread replies)
  app.message(async ({ message, logger }) => {
    const msg = message as GenericMessageEvent

    // Skip bot messages, subtypes (edits, deletes, joins), and thread replies
    if (msg.subtype || !msg.text || !msg.user) return
    if (msg.thread_ts && msg.thread_ts !== msg.ts) return

    try {
      const customer = await client.upsertCustomer({
        externalId: `slack:${msg.user}`,
        name: `Slack User ${msg.user}`,
        email: `${msg.user}@slack.local`,
      })

      const existing = await client.getOpenTicketByCustomer(customer.id)

      let ticket
      let action: 'ticket_created' | 'ticket_updated'

      if (existing) {
        await client.addReply({
          ticketId: existing.id,
          body: msg.text,
          agentId: 'slack-bot',
        })
        ticket = existing
        action = 'ticket_updated'
      } else {
        ticket = await client.createTicket({
          subject: msg.text.slice(0, 80),
          body: msg.text,
          customerId: customer.id,
          priority: 'normal',
        })
        action = 'ticket_created'
      }

      trackSlackMessageReceived({
        orgId: ORG_ID,
        slackWorkspaceId: msg.team ?? 'unknown',
        slackChannelId: msg.channel,
        slackUserId: msg.user,
        ticketId: ticket.id,
        action,
      })
    } catch (err) {
      logger.error('Failed to process Slack message', err)
    }
  })

  // Handle thread replies — bidirectional sync back to SparkDesk
  app.event('message', async ({ event, logger }) => {
    const msg = event as GenericMessageEvent

    // Only process thread replies
    if (!msg.thread_ts || msg.thread_ts === msg.ts) return
    if (msg.subtype || !msg.text || !msg.user) return

    try {
      trackSlackReplyReceived({
        orgId: ORG_ID,
        ticketId: `slack-thread:${msg.thread_ts}`,
        slackChannelId: msg.channel,
        slackUserId: msg.user,
        inThread: true,
      })
    } catch (err) {
      logger.error('Failed to process Slack thread reply', err)
    }
  })
}
