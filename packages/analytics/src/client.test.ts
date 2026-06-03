import { describe, it, expect, afterEach } from 'vitest'

describe('analytics client', () => {
  afterEach(() => {
    delete process.env.POSTHOG_API_KEY
  })

  it('getAnalyticsClient returns null when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
    // Dynamic import to get a fresh module evaluation
    const { getAnalyticsClient } = await import('./client')
    expect(getAnalyticsClient()).toBeNull()
  })

  it('capture does not throw when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
    const { capture } = await import('./client')
    expect(() =>
      capture('test_event', { distinctId: 'user-1', orgId: 'org-1' })
    ).not.toThrow()
  })
})
