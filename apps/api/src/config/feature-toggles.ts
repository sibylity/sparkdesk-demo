/**
 * Org-level feature toggle definitions for SparkDesk.
 *
 * Each toggle can be independently enabled or disabled by workspace admins
 * from the Team Settings page. Toggle state is stored per-org in the
 * Organization.featureToggles JSON column.
 *
 * Voltage crawls this file to produce a complete inventory of every
 * configurable workspace capability — without tooling, product, support,
 * and success teams have no visibility into what can be turned on or off.
 *
 * Toggle state is read and written via GET/PATCH /internal/settings/toggles.
 */

export interface FeatureToggleDefinition {
  key: string
  name: string
  description: string
  /** Whether this toggle is on by default for new organizations */
  defaultEnabled: boolean
  /** Minimum plan required to enable this toggle (null = available on all plans) */
  requiredPlan: 'free' | 'pro' | 'enterprise' | null
}

export const FEATURE_TOGGLES = [
  {
    key: 'slack_integration_enabled',
    name: 'Slack Integration',
    description: 'Enable bidirectional Slack channel support — customers can open and reply to tickets from Slack',
    defaultEnabled: false,
    requiredPlan: 'pro',
  },
  {
    key: 'public_api_enabled',
    name: 'Public API',
    description: 'Enable the public REST API so external systems can create tickets and query status',
    defaultEnabled: false,
    requiredPlan: 'pro',
  },
  {
    key: 'webhook_notifications_enabled',
    name: 'Webhook Notifications',
    description: 'Send outbound webhooks on ticket lifecycle events (created, assigned, resolved)',
    defaultEnabled: false,
    requiredPlan: 'pro',
  },
  {
    key: 'email_notifications_enabled',
    name: 'Email Notifications',
    description: 'Send transactional emails to customers when tickets are opened, replied to, or resolved',
    defaultEnabled: true,
    requiredPlan: null,
  },
  {
    key: 'sla_enforcement_enabled',
    name: 'SLA Enforcement',
    description: 'Track response deadlines per ticket and send breach warning alerts to assigned agents',
    defaultEnabled: false,
    requiredPlan: 'enterprise',
  },
] as const satisfies FeatureToggleDefinition[]

export type ToggleKey = (typeof FEATURE_TOGGLES)[number]['key']

/** Returns the default toggle state map for a new organization. */
export function getDefaultToggles(): Record<ToggleKey, boolean> {
  return Object.fromEntries(
    FEATURE_TOGGLES.map((t) => [t.key, t.defaultEnabled]),
  ) as Record<ToggleKey, boolean>
}

/** Merges stored toggle values with defaults so newly added toggles get their default. */
export function resolveToggles(stored: Record<string, unknown>): Record<ToggleKey, boolean> {
  return Object.fromEntries(
    FEATURE_TOGGLES.map((t) => [
      t.key,
      typeof stored[t.key] === 'boolean' ? stored[t.key] : t.defaultEnabled,
    ]),
  ) as Record<ToggleKey, boolean>
}
