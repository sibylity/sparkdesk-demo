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
  // TODO(flags): integrate LaunchDarkly Node SDK for SSR evaluation
  return FEATURE_FLAGS[flag].defaultValue
}
