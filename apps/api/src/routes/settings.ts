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

  const validKeys = new Set<string>(FEATURE_TOGGLES.map((t) => t.key))
  const updates: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(body)) {
    if (validKeys.has(key) && typeof value === 'boolean') {
      updates[key] = value
    }
  }

  const org = await db.organization.findUnique({ where: { id: orgId } })
  if (!org) return c.json({ error: 'Organization not found' }, 404)

  const current = (org.featureToggles ?? {}) as Record<string, boolean>
  await db.organization.update({
    where: { id: orgId },
    data: { featureToggles: { ...current, ...updates } as Record<string, boolean> },
  })

  return c.json({ ok: true, updated: Object.keys(updates) })
})
