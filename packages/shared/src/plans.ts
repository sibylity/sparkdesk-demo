/**
 * SparkDesk pricing plan definitions and feature entitlements.
 *
 * This is the source of truth for plan gating across the entire codebase.
 * Voltage crawls this to document the relationship between plan tiers
 * and feature availability — without tooling, sales and GTM teams have
 * no way to know what's included in each plan without reading this file.
 */

export type Plan = 'free' | 'pro' | 'enterprise'

export interface PlanDefinition {
  name: string
  description: string
  /** Maximum number of agents (null = unlimited) */
  maxAgents: number | null
  /** Maximum tickets per month (null = unlimited) */
  maxTicketsPerMonth: number | null
}

/**
 * Human-readable plan metadata. Used in pricing pages, upgrade prompts,
 * and sales documentation.
 */
export const PLAN_DEFINITIONS: Record<Plan, PlanDefinition> = {
  free: {
    name: 'Free',
    description: 'Single agent, limited ticket volume, no integrations',
    maxAgents: 1,
    maxTicketsPerMonth: 100,
  },
  pro: {
    name: 'Pro',
    description: 'Multiple agents, Slack integration, webhooks, public API access',
    maxAgents: 20,
    maxTicketsPerMonth: null,
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Unlimited agents, SSO-ready, advanced reporting, priority support',
    maxAgents: null,
    maxTicketsPerMonth: null,
  },
}

export interface PlanFeatureDefinition {
  minimumPlan: Plan
  description: string
}

/**
 * Feature gate definitions. Each key maps to the minimum plan required
 * to access that feature.
 *
 * Enforced server-side via apps/api/src/middleware/plan-gate.ts.
 * Checked client-side in apps/web to show upgrade prompts.
 * There should be no plan-gate logic anywhere that doesn't reference
 * this record — it is the canonical source.
 */
export const PLAN_FEATURES = {
  slack_integration: {
    minimumPlan: 'pro' as Plan,
    description: 'Bidirectional Slack channel integration for customer support tickets',
  },
  public_api: {
    minimumPlan: 'pro' as Plan,
    description: 'External REST API access with API key authentication',
  },
  webhook_registration: {
    minimumPlan: 'pro' as Plan,
    description: 'Register webhook endpoints to receive ticket lifecycle events',
  },
  advanced_reporting: {
    minimumPlan: 'pro' as Plan,
    description: 'SLA performance reports, agent workload analysis, CSAT trends',
  },
  multiple_agents: {
    minimumPlan: 'pro' as Plan,
    description: 'Invite more than one agent to the workspace',
  },
  sso_auth: {
    minimumPlan: 'enterprise' as Plan,
    description: 'Single sign-on via WorkOS SSO (SAML, OIDC)',
  },
  custom_sla_rules: {
    minimumPlan: 'enterprise' as Plan,
    description: 'Configure SLA deadline rules per ticket priority and channel',
  },
} as const satisfies Record<string, PlanFeatureDefinition>

export type FeatureKey = keyof typeof PLAN_FEATURES

const PLAN_ORDER: Plan[] = ['free', 'pro', 'enterprise']

/**
 * Returns true if the given plan meets the minimum requirement for a feature.
 * Use this anywhere plan-gating decisions are made.
 */
export function planHasFeature(orgPlan: Plan, feature: FeatureKey): boolean {
  const required = PLAN_FEATURES[feature].minimumPlan
  return PLAN_ORDER.indexOf(orgPlan) >= PLAN_ORDER.indexOf(required)
}
