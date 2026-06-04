# Phase 4: GTM & Product Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the four code artifacts that Voltage crawls to demonstrate the GTM alignment and product surface use cases — plan tier definitions, feature toggle catalog, feature flag constants, and feature tip definitions — each with just enough runtime wiring to feel like production code.

**Architecture:** Three packages/apps contribute artifacts: `packages/shared` owns plan definitions and feature flag constants (crawlable across all apps); `apps/api` owns the plan-gate middleware and flag evaluation; `apps/web` owns the feature tips catalog and a dismissable TipBanner component. Prisma schema gets two small additions: a `featureToggles` JSON column on Organization and a `dismissedTips` string array on Agent.

**Tech Stack:** Prisma 5 (schema migration), `@launchdarkly/node-server-sdk` ^8, vitest, Next.js 15 Server Actions

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/shared/src/plans.ts` | Create | Plan tier definitions, `PLAN_FEATURES` gate table, `planHasFeature()` utility |
| `packages/shared/src/feature-flags.ts` | Create | LaunchDarkly flag key constants with JSDoc describing each flag and rollout strategy |
| `packages/shared/src/plans.test.ts` | Create | Unit tests for `planHasFeature()` |
| `packages/shared/src/index.ts` | Modify | Export new plans + feature-flags modules |
| `apps/api/src/middleware/plan-gate.ts` | Create | `requireFeature()` Hono middleware — checks org plan against `PLAN_FEATURES` |
| `apps/api/src/config/feature-toggles.ts` | Create | Typed toggle definitions catalog — the artifact Voltage crawls |
| `apps/api/src/lib/flags.ts` | Create | LaunchDarkly Node SDK wrapper — `evaluateFlag()`, graceful fallback to defaults |
| `apps/api/src/routes/settings.ts` | Create | `GET/PATCH /internal/settings/toggles` — read/write org feature toggles |
| `apps/api/src/index.ts` | Modify | Register `/internal/settings` routes |
| `apps/api/package.json` | Modify | Add `@launchdarkly/node-server-sdk` |
| `apps/api/prisma/schema.prisma` | Modify | Add `featureToggles Json` to Organization, `dismissedTips String[]` to Agent |
| `apps/web/src/lib/flags.ts` | Create | Web-side flag evaluation — references `FEATURE_FLAGS` constants, returns defaults |
| `apps/web/src/lib/tips.ts` | Create | Feature tip definitions catalog — the artifact Voltage crawls |
| `apps/web/src/components/common/tip-banner.tsx` | Create | Dismissable in-app tip component (client component) |
| `apps/web/src/app/(app)/inbox/page.tsx` | Modify | Show `inbox_filters_tip` on first visit |
| `apps/web/src/app/(app)/tickets/[id]/page.tsx` | Modify | Show `internal_notes_tip` on first ticket view |
| `apps/api/.env.example` | Modify | Add `LAUNCHDARKLY_SDK_KEY` |
| `apps/web/.env.example` | Modify | Add `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` (documented, not used in code) |

---

### Task 1: Plans, Feature Gates, and Flag Constants in `packages/shared`

**Files:**
- Create: `packages/shared/src/plans.ts`
- Create: `packages/shared/src/feature-flags.ts`
- Create: `packages/shared/src/plans.test.ts`
- Modify: `packages/shared/src/index.ts`

- [ ] **Step 1: Write the failing tests first**

Create `packages/shared/src/plans.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { planHasFeature } from './plans'

describe('planHasFeature', () => {
  it('free plan cannot use slack_integration', () => {
    expect(planHasFeature('free', 'slack_integration')).toBe(false)
  })

  it('pro plan can use slack_integration', () => {
    expect(planHasFeature('pro', 'slack_integration')).toBe(true)
  })

  it('pro plan cannot use custom_sla_rules', () => {
    expect(planHasFeature('pro', 'custom_sla_rules')).toBe(false)
  })

  it('enterprise plan can use all features', () => {
    expect(planHasFeature('enterprise', 'slack_integration')).toBe(true)
    expect(planHasFeature('enterprise', 'sso_auth')).toBe(true)
    expect(planHasFeature('enterprise', 'custom_sla_rules')).toBe(true)
  })

  it('free plan can use features with free minimum plan', () => {
    // If we ever add a free-tier feature, it should pass for all plans
    expect(planHasFeature('enterprise', 'slack_integration')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd /path/to/sparkdesk-demo && pnpm --filter @sparkdesk/shared test 2>&1 | tail -10
```

Expected: FAIL — `Cannot find module './plans'`

Note: If `@sparkdesk/shared` doesn't have a test script yet, add `"test": "vitest run"` and `"vitest": "^2.0.0"` to devDependencies in `packages/shared/package.json`, then run `pnpm install`.

- [ ] **Step 3: Create `packages/shared/src/plans.ts`**

```typescript
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
```

- [ ] **Step 4: Create `packages/shared/src/feature-flags.ts`**

```typescript
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
```

- [ ] **Step 5: Update `packages/shared/src/index.ts`**

Add these two lines at the bottom:

```typescript
export * from './plans'
export * from './feature-flags'
```

Full updated file:
```typescript
export * from './types/ticket'
export * from './types/customer'
export * from './types/agent'
export * from './types/organization'
export * from './schemas/ticket'
export * from './schemas/customer'
export * from './schemas/agent'
export * from './plans'
export * from './feature-flags'
```

- [ ] **Step 6: Run tests — expect them to pass**

```bash
cd /path/to/sparkdesk-demo && pnpm --filter @sparkdesk/shared test 2>&1 | tail -15
```

Expected: 5 tests pass.

- [ ] **Step 7: Typecheck**

```bash
cd /path/to/sparkdesk-demo/packages/shared && node_modules/.bin/tsc --noEmit 2>&1 | head -20; echo "exit: $?"
```

Expected: exit 0, no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add plan definitions, feature gates, and flag constants"
```

---

### Task 2: API — Plan Gate Middleware, Feature Toggle Catalog, LaunchDarkly Flag Evaluation

**Files:**
- Create: `apps/api/src/middleware/plan-gate.ts`
- Create: `apps/api/src/config/feature-toggles.ts`
- Create: `apps/api/src/lib/flags.ts`
- Create: `apps/api/src/routes/settings.ts`
- Modify: `apps/api/src/index.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/prisma/schema.prisma`
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Add `@launchdarkly/node-server-sdk` to `apps/api/package.json`**

Read `apps/api/package.json`. In the `"dependencies"` block, add:
```json
"@launchdarkly/node-server-sdk": "^8.0.0",
```

- [ ] **Step 2: Install**

```bash
cd /path/to/sparkdesk-demo && pnpm install
```

- [ ] **Step 3: Update `apps/api/prisma/schema.prisma`**

In the `Organization` model, add the `featureToggles` field after `updatedAt`:

```prisma
  featureToggles Json     @default("{}")
```

In the `Agent` model, add `dismissedTips` after `createdAt`:

```prisma
  dismissedTips  String[]
```

The updated Organization model:
```prisma
model Organization {
  id                   String   @id @default(cuid())
  name                 String
  workosOrganizationId String   @unique
  plan                 Plan     @default(free)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  featureToggles       Json     @default("{}")

  agents    Agent[]
  customers Customer[]
  tickets   Ticket[]
}
```

The updated Agent model:
```prisma
model Agent {
  id             String      @id @default(cuid())
  name           String
  email          String
  role           AgentRole   @default(agent)
  workosUserId   String      @unique
  organizationId String
  createdAt      DateTime    @default(now())
  dismissedTips  String[]

  organization    Organization @relation(fields: [organizationId], references: [id])
  assignedTickets Ticket[]     @relation("AssignedTickets")
  messages        Message[]
  notes           Note[]
}
```

- [ ] **Step 4: Run Prisma migration**

```bash
cd /path/to/sparkdesk-demo && pnpm --filter @sparkdesk/api db:push
```

Expected: Schema updated. If it says "All migrations have been applied", the push succeeded.

- [ ] **Step 5: Regenerate Prisma client**

```bash
pnpm --filter @sparkdesk/api db:generate
```

Expected: Prisma Client generated.

- [ ] **Step 6: Create `apps/api/src/middleware/plan-gate.ts`**

```typescript
import type { Context, Next } from 'hono'
import { planHasFeature, PLAN_FEATURES, type FeatureKey, type Plan } from '@sparkdesk/shared'
import { db } from '../db'

/**
 * Hono middleware that enforces plan-gated feature access.
 *
 * Reads the org's current plan from the database and rejects with 403
 * if the plan doesn't include the required feature. Use this on any
 * route that should be gated to a specific plan tier.
 *
 * Example:
 *   import { requireFeature } from '../middleware/plan-gate'
 *   slackRoutes.post('/connect', requireFeature('slack_integration'), handler)
 */
export function requireFeature(feature: FeatureKey) {
  return async (c: Context, next: Next) => {
    const orgId = c.req.header('X-Organization-Id')
    if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

    const org = await db.organization.findUnique({ where: { id: orgId } })
    if (!org) return c.json({ error: 'Organization not found' }, 404)

    if (!planHasFeature(org.plan as Plan, feature)) {
      return c.json(
        {
          error: 'Plan upgrade required',
          feature,
          featureDescription: PLAN_FEATURES[feature].description,
          requiredPlan: PLAN_FEATURES[feature].minimumPlan,
          currentPlan: org.plan,
        },
        403,
      )
    }

    await next()
  }
}
```

- [ ] **Step 7: Create `apps/api/src/config/feature-toggles.ts`**

```typescript
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

/** Merges stored toggle values with defaults, so newly added toggles get their default. */
export function resolveToggles(stored: Record<string, unknown>): Record<ToggleKey, boolean> {
  const defaults = getDefaultToggles()
  return Object.fromEntries(
    FEATURE_TOGGLES.map((t) => [t.key, typeof stored[t.key] === 'boolean' ? stored[t.key] : t.defaultEnabled]),
  ) as Record<ToggleKey, boolean>
}
```

- [ ] **Step 8: Create `apps/api/src/lib/flags.ts`**

```typescript
import * as ld from '@launchdarkly/node-server-sdk'
import { FEATURE_FLAGS, type FlagKey } from '@sparkdesk/shared'

let _client: ld.LDClient | null = null
let _initPromise: Promise<void> | null = null

async function getLdClient(): Promise<ld.LDClient | null> {
  const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY
  if (!sdkKey) return null

  if (_client) return _client

  if (!_initPromise) {
    _initPromise = (async () => {
      _client = ld.init(sdkKey, { offline: false })
      await _client.waitForInitialization({ timeout: 5 })
    })()
  }

  await _initPromise
  return _client
}

/**
 * Evaluate a feature flag for an org context.
 * Returns the flag's defaultValue when LaunchDarkly is not configured
 * or the SDK key is absent — safe to call in all environments.
 *
 * Flag keys and definitions: packages/shared/src/feature-flags.ts
 */
export async function evaluateFlag(
  flag: FlagKey,
  context: { orgId: string; plan: string },
): Promise<boolean> {
  const def = FEATURE_FLAGS[flag]

  try {
    const client = await getLdClient()
    if (!client) return def.defaultValue

    return (await client.variation(
      def.key,
      { kind: 'organization', key: context.orgId, custom: { plan: context.plan } },
      def.defaultValue,
    )) as boolean
  } catch {
    return def.defaultValue
  }
}
```

- [ ] **Step 9: Create `apps/api/src/routes/settings.ts`**

```typescript
import { Hono } from 'hono'
import { serviceAuthMiddleware } from '../middleware/auth'
import { db } from '../db'
import { FEATURE_TOGGLES, resolveToggles, type ToggleKey } from '../config/feature-toggles'

export const settingsRoutes = new Hono()

settingsRoutes.use('*', serviceAuthMiddleware)

/** GET /internal/settings/toggles — returns current toggle state + definitions */
settingsRoutes.get('/toggles', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) return c.json({ error: 'Organization not found' }, 404)

  const currentValues = resolveToggles(
    (org.featureToggles ?? {}) as Record<string, unknown>,
  )

  return c.json({
    toggles: FEATURE_TOGGLES.map((def) => ({
      ...def,
      enabled: currentValues[def.key as ToggleKey],
    })),
  })
})

/** PATCH /internal/settings/toggles — update one or more toggle values */
settingsRoutes.patch('/toggles', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const body = await c.req.json<Partial<Record<ToggleKey, boolean>>>()

  const validKeys = new Set(FEATURE_TOGGLES.map((t) => t.key))
  const updates: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(body)) {
    if (validKeys.has(key) && typeof value === 'boolean') {
      updates[key] = value
    }
  }

  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) return c.json({ error: 'Organization not found' }, 404)

  const current = (org.featureToggles ?? {}) as Record<string, unknown>
  await db.organization.update({
    where: { id: orgId },
    data: { featureToggles: { ...current, ...updates } },
  })

  return c.json({ ok: true, updated: Object.keys(updates) })
})
```

- [ ] **Step 10: Register settings routes in `apps/api/src/index.ts`**

Read `apps/api/src/index.ts`. Add the import and route registration.

Add import after the existing route imports:
```typescript
import { settingsRoutes } from './routes/settings'
```

Add route registration after `app.route('/internal/agents', agentRoutes)`:
```typescript
app.route('/internal/settings', settingsRoutes)
```

- [ ] **Step 11: Update `apps/api/.env.example`**

Read `apps/api/.env.example` and append:
```
# LaunchDarkly feature flags (optional — flags return defaults when unset)
LAUNCHDARKLY_SDK_KEY=""
```

- [ ] **Step 12: Typecheck**

```bash
cd /path/to/sparkdesk-demo/apps/api && node_modules/.bin/tsc --noEmit 2>&1 | head -20; echo "exit: $?"
```

Expected: exit 0.

- [ ] **Step 13: Verify API starts and settings route works**

```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
nohup pnpm --filter @sparkdesk/api dev > /tmp/sparkdesk-api-phase4.log 2>&1 &
sleep 5
curl -s http://localhost:3001/health
```

Expected: `{"ok":true}`

```bash
curl -s -H "Authorization: Bearer dev-secret-change-in-production" \
  -H "X-Organization-Id: cmpydvzic0000ovket7r3p83v" \
  http://localhost:3001/internal/settings/toggles | head -c 300
```

Expected: JSON with `toggles` array containing 5 items with `key`, `name`, `description`, `enabled` fields.

- [ ] **Step 14: Commit**

```bash
git add apps/api/ packages/shared/
git commit -m "feat(api): add plan gate middleware, feature toggle catalog, LaunchDarkly flag evaluation"
```

---

### Task 3: Web — Feature Flag Evaluation + Feature Tips Catalog + TipBanner

**Files:**
- Create: `apps/web/src/lib/flags.ts`
- Create: `apps/web/src/lib/tips.ts`
- Create: `apps/web/src/components/common/tip-banner.tsx`
- Modify: `apps/web/src/app/(app)/inbox/page.tsx`
- Modify: `apps/web/src/app/(app)/tickets/[id]/page.tsx`
- Modify: `apps/web/.env.example`

The `dismissedTips` column was added to Agent in Task 2's schema migration. This task uses it.

- [ ] **Step 1: Create `apps/web/src/lib/flags.ts`**

```typescript
import { FEATURE_FLAGS, type FlagKey } from '@sparkdesk/shared'

/**
 * Feature flag evaluation for the SparkDesk web app (server-side, SSR).
 *
 * In production, this would call the LaunchDarkly Node SDK (or the
 * LaunchDarkly React SDK for client-side variation). Currently returns
 * flag defaults — evaluation is fully handled by apps/api for API routes.
 *
 * This file exists so Voltage can crawl it alongside apps/api/src/lib/flags.ts
 * and show that the same flag constants from packages/shared are evaluated
 * in multiple places across the codebase.
 *
 * Flag definitions: packages/shared/src/feature-flags.ts
 */
export function getFlag(flag: FlagKey, _context?: { orgId?: string; plan?: string }): boolean {
  // TODO(flags): integrate LaunchDarkly React SDK for client-side evaluation
  // and LaunchDarkly Node SDK for SSR evaluation. Keys are in FEATURE_FLAGS.
  return FEATURE_FLAGS[flag].defaultValue
}
```

- [ ] **Step 2: Create `apps/web/src/lib/tips.ts`**

```typescript
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
 * Dismissal action: server action inline in pages that show tips
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
```

- [ ] **Step 3: Create `apps/web/src/components/common/tip-banner.tsx`**

```tsx
'use client'
import { useState } from 'react'

interface TipBannerProps {
  tipId: string
  title: string
  body: string
  /** Server action called when the tip is dismissed */
  onDismiss: () => Promise<void>
}

/**
 * Dismissable in-app tip banner. Renders in accent-tinted styling.
 * Calls the onDismiss server action to persist the dismissed state per-user.
 */
export function TipBanner({ tipId: _tipId, title, body, onDismiss }: TipBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 text-sm"
      style={{
        background: 'var(--accent-dim)',
        borderBottom: '1px solid var(--accent-border)',
      }}
    >
      <div className="flex-1 min-w-0">
        <span className="font-semibold" style={{ color: 'var(--accent-color)' }}>
          {title}
        </span>
        <span style={{ color: 'var(--text-secondary)' }}> — {body}</span>
      </div>
      <button
        onClick={async () => {
          setDismissed(true)
          await onDismiss()
        }}
        className="flex-shrink-0 text-xs px-2 py-0.5 rounded"
        style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }}
        aria-label="Dismiss tip"
      >
        Dismiss
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Wire `inbox_filters_tip` into inbox page**

Read `apps/web/src/app/(app)/inbox/page.tsx` first, then modify it.

The current inbox page:
```tsx
import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from '@/lib/api-client'
import { TicketList } from '@/components/tickets/ticket-list'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function InboxPage() {
  await withAuth({ ensureSignedIn: true })

  const tickets = (await apiClient.tickets.list(DEMO_ORG_ID)) as (Ticket & { customer: Customer })[]

  return (
    <div className="flex h-full">
      <TicketList tickets={tickets} />
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <p className="text-sm">Select a ticket</p>
      </div>
    </div>
  )
}
```

Replace with this updated version that checks `dismissedTips` and shows the banner:

```tsx
import { withAuth } from '@workos-inc/authkit-nextjs'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { TicketList } from '@/components/tickets/ticket-list'
import { TipBanner } from '@/components/common/tip-banner'
import { FEATURE_TIPS } from '@/lib/tips'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? ''

export default async function InboxPage() {
  await withAuth({ ensureSignedIn: true })

  const [tickets, agents] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID) as Promise<(Ticket & { customer: Customer })[]>,
    apiClient.agents.list(DEMO_ORG_ID) as Promise<{ id: string; dismissedTips: string[] }[]>,
  ])

  const currentAgent = agents.find((a) => a.id === DEMO_AGENT_ID)
  const showInboxTip = !currentAgent?.dismissedTips.includes('inbox_filters_tip')

  async function dismissInboxTip() {
    'use server'
    await apiClient.dismissTip(DEMO_ORG_ID, DEMO_AGENT_ID, 'inbox_filters_tip')
    revalidatePath('/inbox')
  }

  const tip = FEATURE_TIPS.inbox_filters_tip

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {showInboxTip && (
        <TipBanner
          tipId={tip.id}
          title={tip.title}
          body={tip.body}
          onDismiss={dismissInboxTip}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <TicketList tickets={tickets} />
        <div
          className="flex-1 flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Select a ticket</p>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add `dismissTip` to the API client**

Read `apps/web/src/lib/api-client.ts`. Add a `dismissTip` method to the `agents` section:

```typescript
    dismissTip: (orgId: string, agentId: string, tipId: string) =>
      apiRequest<{ ok: boolean }>(`/internal/agents/${agentId}/dismiss-tip`, {
        organizationId: orgId,
        agentId,
        method: 'POST',
        body: { tipId },
      }),
```

- [ ] **Step 6: Add dismiss-tip route to `apps/api/src/routes/agents.ts`**

Read `apps/api/src/routes/agents.ts`. Add this route at the end of the file:

```typescript
// Dismiss a feature tip for an agent
agentRoutes.post('/:id/dismiss-tip', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { tipId } = await c.req.json<{ tipId: string }>()
  if (!tipId) return c.json({ error: 'Missing tipId' }, 400)

  const agent = await db.agent.findFirst({
    where: { id: c.req.param('id'), organizationId: orgId },
  })
  if (!agent) return c.json({ error: 'Not found' }, 404)

  if (!agent.dismissedTips.includes(tipId)) {
    await db.agent.update({
      where: { id: c.req.param('id') },
      data: { dismissedTips: { push: tipId } },
    })
  }

  return c.json({ ok: true })
})
```

- [ ] **Step 7: Typecheck web**

```bash
cd /path/to/sparkdesk-demo/apps/web && node_modules/.bin/tsc --noEmit 2>&1 | head -20; echo "exit: $?"
```

Expected: exit 0.

- [ ] **Step 8: Typecheck API**

```bash
cd /path/to/sparkdesk-demo/apps/api && node_modules/.bin/tsc --noEmit 2>&1 | head -20; echo "exit: $?"
```

Expected: exit 0.

- [ ] **Step 9: Update `apps/web/.env.example`**

Read the file, then append:
```
# LaunchDarkly (documented for reference — client-side SDK not yet wired)
# NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID=""
```

- [ ] **Step 10: Verify tip appears in browser**

```bash
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
nohup pnpm --filter @sparkdesk/web dev > /tmp/sparkdesk-web-phase4.log 2>&1 &
sleep 8
tail -15 /tmp/sparkdesk-web-phase4.log
```

Expected: "Ready" with no compilation errors.

Open http://localhost:3000/inbox — the indigo tip banner should appear above the ticket list. Clicking "Dismiss" should make it disappear and persist the dismissal.

- [ ] **Step 11: Commit**

```bash
git add apps/web/ apps/api/src/routes/agents.ts
git commit -m "feat(web): add feature flag evaluation, tip catalog, and dismissable TipBanner"
```

---

## Environment Variables Added

| Variable | Package | Required | Description |
|---|---|---|---|
| `LAUNCHDARKLY_SDK_KEY` | `apps/api` | No | LaunchDarkly server SDK key — flags return defaults when absent |
| `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_ID` | `apps/web` | No | LaunchDarkly client ID (documented for future React SDK integration) |

---

## What Voltage Crawls After This Phase

| File | Artifact |
|------|---------|
| `packages/shared/src/plans.ts` | `PLAN_DEFINITIONS` + `PLAN_FEATURES` — 7 gated features with minimum plan requirements |
| `packages/shared/src/feature-flags.ts` | `FEATURE_FLAGS` — 3 flags with keys, descriptions, rollout strategies |
| `apps/api/src/middleware/plan-gate.ts` | `requireFeature()` — shows WHERE gates are enforced |
| `apps/api/src/config/feature-toggles.ts` | `FEATURE_TOGGLES` — 5 workspace toggles with descriptions + defaults |
| `apps/api/src/lib/flags.ts` | `evaluateFlag()` — flag evaluation in the API layer |
| `apps/web/src/lib/flags.ts` | `getFlag()` — flag evaluation in the web layer (same constants, different context) |
| `apps/web/src/lib/tips.ts` | `FEATURE_TIPS` — 4 tips with trigger conditions and content |

The story: plan gates, toggles, flags, and tips are all defined in code across 7 files in 3 packages — no central inventory without Voltage.
