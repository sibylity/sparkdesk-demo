/**
 * LaunchDarkly feature flag key definitions for SparkDesk.
 *
 * Flag keys are defined here as typed constants so every reference across
 * apps/api and apps/web uses the same string — a typo in a flag key is a
 * build error, not a silent miss at runtime.
 *
 * Voltage crawls this file to document every flag, its purpose, rollout
 * strategy, and default value. Without tooling, there is no central
 * inventory of active flags — they're scattered across the codebase as
 * string literals.
 *
 * Flag evaluation:
 *   Server-side (API): apps/api/src/lib/flags.ts
 *   Web (SSR):         apps/web/src/lib/flags.ts
 */

export interface FlagDefinition {
  /** The LaunchDarkly flag key string */
  key: string
  description: string
  /** Rollout strategy and targeting rules */
  rollout: string
  /** Value returned when LaunchDarkly is unavailable or the flag is not configured */
  defaultValue: boolean
}

export const FEATURE_FLAGS = {
  NEW_TICKET_INBOX_UI: {
    key: 'new-ticket-inbox-ui',
    description: 'Gradual rollout of the redesigned ticket inbox with improved filter UX and bulk actions',
    rollout: 'Percentage rollout — 10% of orgs initially, ramp to 100% over 2 weeks after no regressions',
    defaultValue: false,
  },
  AI_REPLY_SUGGESTIONS: {
    key: 'ai-reply-suggestions',
    description: 'Show AI-drafted reply suggestions to agents in the reply composer (Claude-powered)',
    rollout: 'Opt-in beta — enabled for orgs with ai_beta_access=true custom attribute in LaunchDarkly',
    defaultValue: false,
  },
  BULK_TICKET_ACTIONS: {
    key: 'bulk-ticket-actions',
    description: 'Batch assign, resolve, or label tickets from the inbox list view',
    rollout: 'Pro plan and above — percentage rollout starting at 25% after internal dog-fooding',
    defaultValue: false,
  },
} as const satisfies Record<string, FlagDefinition>

export type FlagKey = keyof typeof FEATURE_FLAGS
