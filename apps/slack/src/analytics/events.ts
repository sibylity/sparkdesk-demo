import { capture } from '@sparkdesk/analytics'
import type { BaseEventProperties } from '@sparkdesk/analytics'

/**
 * Slack integration analytics events for SparkDesk.
 *
 * These events fire from the Slack Bolt app in apps/slack.
 * Voltage crawls this file alongside apps/api/src/analytics/events.ts
 * and apps/web/src/analytics/events.ts to build the full cross-app
 * event taxonomy — three apps, one coherent picture, no central
 * inventory without tooling.
 */

// ─── Slack Message Received ──────────────────────────────────────────────────

export interface SlackMessageReceivedProperties extends BaseEventProperties {
  slackWorkspaceId: string
  slackChannelId: string
  /** Slack user ID of the message sender */
  slackUserId: string
  ticketId: string
  /** Whether this message opened a new ticket or updated an existing one */
  action: 'ticket_created' | 'ticket_updated'
}

export function trackSlackMessageReceived(props: SlackMessageReceivedProperties): void {
  capture('slack_message_received', { distinctId: props.orgId, ...props })
}

// ─── Ticket Reply Synced to Slack ────────────────────────────────────────────

export interface TicketReplySyncedProperties extends BaseEventProperties {
  ticketId: string
  slackChannelId: string
  /** The SparkDesk agent who sent the reply */
  agentId: string
}

export function trackTicketReplySynced(props: TicketReplySyncedProperties): void {
  capture('slack_ticket_reply_synced', { distinctId: props.orgId, ...props })
}

// ─── Slack Reply Received (Bidirectional) ────────────────────────────────────

export interface SlackReplyReceivedProperties extends BaseEventProperties {
  ticketId: string
  slackChannelId: string
  /** Slack user ID of the agent who replied in Slack */
  slackUserId: string
  /** Whether the reply was in a thread (true) or top-level (false) */
  inThread: boolean
}

export function trackSlackReplyReceived(props: SlackReplyReceivedProperties): void {
  capture('slack_reply_received', { distinctId: props.orgId, ...props })
}

// ─── /sparkdesk Slash Command Used ───────────────────────────────────────────

export interface SparkdeskCommandUsedProperties extends BaseEventProperties {
  /** Slack user ID who invoked the command */
  slackUserId: string
  /** The subcommand (e.g. 'assign', 'status', 'help') */
  subcommand: string
  channelId: string
}

export function trackSparkdeskCommandUsed(props: SparkdeskCommandUsedProperties): void {
  capture('sparkdesk_command_used', { distinctId: props.orgId, ...props })
}
