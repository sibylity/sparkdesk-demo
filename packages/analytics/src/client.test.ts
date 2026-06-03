import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('analytics client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    delete process.env.POSTHOG_API_KEY
  })

  it('getAnalyticsClient returns null when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
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

  it('shutdownAnalytics does not throw when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
    const { shutdownAnalytics } = await import('./client')
    await expect(shutdownAnalytics()).resolves.not.toThrow()
  })
})
