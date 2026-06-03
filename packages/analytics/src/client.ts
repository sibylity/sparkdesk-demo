import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

/**
 * Returns the PostHog server-side client.
 * Returns null (and is a safe no-op) when POSTHOG_API_KEY is not set —
 * so local development and CI work without a PostHog account.
 */
export function getAnalyticsClient(): PostHog | null {
  if (_client) return _client
  if (!process.env.POSTHOG_API_KEY) return null

  _client = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
  })
  return _client
}

/**
 * Fire a server-side event. No-ops when PostHog is not configured.
 * The `distinctId` field is required and should be the primary actor
 * (orgId for workspace-level events, agentId for agent-level events).
 */
export function capture(
  event: string,
  properties: Record<string, unknown> & { distinctId: string }
): void {
  const { distinctId, ...rest } = properties
  getAnalyticsClient()?.capture({ distinctId, event, properties: rest })
}

/** Call during server shutdown to flush queued events. */
export async function shutdownAnalytics(): Promise<void> {
  await getAnalyticsClient()?.shutdown()
}
