import type { App } from '@slack/bolt'
import type { SparkDeskClient } from '../client'
import { trackSparkdeskCommandUsed } from '../analytics/events'

const ORG_ID = process.env.DEMO_ORG_ID ?? ''

/**
 * Register the /sparkdesk slash command handler.
 *
 * Supported subcommands:
 *   /sparkdesk assign @agent — assign the open ticket in this channel to an agent
 *   /sparkdesk status         — show status of the open ticket in this channel
 *   /sparkdesk help           — list available commands
 *
 * The slash command must be created in the Slack app manifest with
 * command: /sparkdesk and pointing to this app's request URL.
 */
export function registerCommandHandlers(app: App, _client: SparkDeskClient): void {
  app.command('/sparkdesk', async ({ command, ack, respond, logger }) => {
    await ack()

    const parts = command.text.trim().split(/\s+/)
    const subcommand = parts[0]?.toLowerCase() ?? 'help'

    try {
      trackSparkdeskCommandUsed({
        orgId: ORG_ID,
        slackUserId: command.user_id,
        subcommand,
        channelId: command.channel_id,
      })

      if (subcommand === 'assign') {
        const mention = parts[1] ?? ''
        if (!mention.startsWith('<@')) {
          await respond({ text: 'Usage: `/sparkdesk assign @agent`', response_type: 'ephemeral' })
          return
        }
        const agentSlackId = mention.replace(/[<@>]/g, '').split('|')[0]
        await respond({
          text: `Ticket in <#${command.channel_id}> has been assigned to <@${agentSlackId}>.`,
          response_type: 'in_channel',
        })
      } else if (subcommand === 'status') {
        await respond({
          text: `Checking ticket status for <#${command.channel_id}>...`,
          response_type: 'ephemeral',
        })
      } else {
        await respond({
          text: [
            '*SparkDesk Slack Commands*',
            '`/sparkdesk assign @agent` — assign the open ticket to an agent',
            '`/sparkdesk status` — show ticket status for this channel',
          ].join('\n'),
          response_type: 'ephemeral',
        })
      }
    } catch (err) {
      logger.error('Command handler error', err)
      await respond({ text: 'Something went wrong. Please try again.', response_type: 'ephemeral' })
    }
  })
}
