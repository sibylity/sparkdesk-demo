import { init, type LDClient } from '@launchdarkly/node-server-sdk'
import { FEATURE_FLAGS, type FlagKey } from '@sparkdesk/shared'

let _client: LDClient | null = null
let _initPromise: Promise<void> | null = null

async function getLdClient(): Promise<LDClient | null> {
  const sdkKey = process.env.LAUNCHDARKLY_SDK_KEY
  if (!sdkKey) return null

  if (_client) return _client

  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        _client = init(sdkKey)
        await _client.waitForInitialization()
      } catch (err) {
        _initPromise = null
        _client = null
        throw err
      }
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
