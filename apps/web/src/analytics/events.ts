import { posthog } from './posthog'
import type { BaseEventProperties } from '@sparkdesk/analytics'

/**
 * UI/dashboard analytics events for the SparkDesk web app.
 *
 * These events fire from client components in apps/web.
 * Voltage crawls this file alongside apps/api/src/analytics/events.ts
 * to build the full cross-app event taxonomy.
 *
 * User identity is set once via posthog.identify() in PostHogProvider —
 * posthog-js attaches it automatically to every event captured here.
 * BaseEventProperties fields are Partial because posthog-js handles them.
 */

// ─── Inbox Filter Applied ────────────────────────────────────────────────────

export interface InboxFilterAppliedProperties extends Partial<BaseEventProperties> {
  filterType: 'status' | 'assignee'
  filterValue: string
}

export function trackInboxFilterApplied(props: InboxFilterAppliedProperties): void {
  posthog.capture('inbox_filter_applied', props)
}

// ─── Ticket Opened ───────────────────────────────────────────────────────────

export interface TicketOpenedProperties extends Partial<BaseEventProperties> {
  ticketId: string
  ticketStatus: string
  ticketPriority: string
}

export function trackTicketOpened(props: TicketOpenedProperties): void {
  posthog.capture('ticket_opened', props)
}

// ─── Reply Submitted ─────────────────────────────────────────────────────────

export interface ReplySubmittedProperties extends Partial<BaseEventProperties> {
  ticketId: string
  replyType: 'reply' | 'note'
  bodyLength: number
}

export function trackReplySubmitted(props: ReplySubmittedProperties): void {
  posthog.capture('reply_submitted', props)
}

// ─── Nav Item Clicked ────────────────────────────────────────────────────────

export interface NavItemClickedProperties extends Partial<BaseEventProperties> {
  destination: string
  label: string
}

export function trackNavItemClicked(props: NavItemClickedProperties): void {
  posthog.capture('nav_item_clicked', props)
}
