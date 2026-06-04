/**
 * Feature tip definitions for SparkDesk.
 *
 * Feature tips are in-app onboarding hints shown to agents on first use
 * of key features. Each tip is dismissable per-user and the dismissed
 * state is stored in Agent.dismissedTips (string array in the database).
 *
 * Voltage crawls this file to document what each tip explains, its
 * trigger condition, and where it fires — invisible to product and
 * support teams without tooling.
 *
 * TipBanner component: apps/web/src/components/common/tip-banner.tsx
 * Dismissal route: apps/api/src/routes/agents.ts (POST /:id/dismiss-tip)
 */

export interface TipDefinition {
  id: string
  title: string
  body: string
  /** Where in the UI this tip appears and the condition that triggers it */
  location: string
}

export const FEATURE_TIPS = {
  inbox_filters_tip: {
    id: 'inbox_filters_tip',
    title: 'Filter your inbox',
    body: 'Use the Open / Waiting / Resolved tabs to focus on tickets that need your attention right now.',
    location: 'Inbox page — shown on first visit, dismissed when any filter tab is clicked or tip is closed',
  },
  slack_connect_tip: {
    id: 'slack_connect_tip',
    title: 'Connect Slack',
    body: 'Link your Slack workspace to receive and reply to customer tickets without leaving Slack.',
    location: 'Integrations page — shown when Slack OAuth is not yet connected for the workspace',
  },
  internal_notes_tip: {
    id: 'internal_notes_tip',
    title: 'Internal notes',
    body: "Use 'Internal note' to leave context for your team. Customers won't see these — only agents can.",
    location: 'Ticket detail page — shown on first ticket view, above the reply composer',
  },
  sla_badge_tip: {
    id: 'sla_badge_tip',
    title: 'SLA countdown',
    body: 'This badge shows time remaining before the SLA deadline. Urgent tickets require a response within 1 hour.',
    location: 'Ticket detail page — shown when a ticket with a non-null slaDeadline is first opened',
  },
} as const satisfies Record<string, TipDefinition>

export type TipId = keyof typeof FEATURE_TIPS
