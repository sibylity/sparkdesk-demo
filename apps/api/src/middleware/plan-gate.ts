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
 * Feature gate definitions: packages/shared/src/plans.ts
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
