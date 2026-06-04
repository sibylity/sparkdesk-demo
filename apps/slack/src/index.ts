import { App, LogLevel } from '@slack/bolt'
import { createSparkDeskClient } from './client'
import { registerMessageHandlers } from './handlers/message'
import { registerReplyHandlers } from './handlers/reply'
import { registerCommandHandlers } from './handlers/commands'

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN
const SLACK_SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET
const SLACK_APP_TOKEN = process.env.SLACK_APP_TOKEN

if (!SLACK_BOT_TOKEN || !SLACK_SIGNING_SECRET) {
  console.warn('[sparkdesk-slack] SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET not set — app will not start')
  process.exit(0)
}

/**
 * SparkDesk Slack Bolt App
 *
 * Connects a Slack workspace to SparkDesk:
 * - Inbound: Slack messages → SparkDesk tickets
 * - Outbound: SparkDesk replies → Slack messages (via apps/api POST /internal/slack/send)
 * - Bidirectional: Thread replies sync both ways
 * - Slash command: /sparkdesk for quick actions from Slack
 *
 * Uses Socket Mode when SLACK_APP_TOKEN is set (local dev, no public URL needed).
 * Uses HTTP mode otherwise (production, requires public URL).
 */
const app = new App({
  token: SLACK_BOT_TOKEN,
  signingSecret: SLACK_SIGNING_SECRET,
  socketMode: Boolean(SLACK_APP_TOKEN),
  appToken: SLACK_APP_TOKEN,
  logLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.ERROR,
})

const sparkdesk = createSparkDeskClient()

registerMessageHandlers(app, sparkdesk)
registerReplyHandlers(app, sparkdesk)
registerCommandHandlers(app, sparkdesk)

const port = Number(process.env.PORT ?? 3002)

;(async () => {
  await app.start(port)
  console.log(`SparkDesk Slack app listening on port ${port}`)
  console.log(`Mode: ${SLACK_APP_TOKEN ? 'Socket Mode' : 'HTTP Mode'}`)
})()
