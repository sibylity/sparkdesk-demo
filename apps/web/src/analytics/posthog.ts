import posthog from 'posthog-js'

export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return

  posthog.init(key, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

export function identifyAgent(params: {
  userId: string
  email?: string
  name?: string
  orgId: string
}): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.identify(params.userId, {
    email: params.email,
    name: params.name,
    orgId: params.orgId,
  })
}

export { posthog }
