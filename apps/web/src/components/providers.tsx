'use client'
import { useEffect } from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { posthog, initPostHog, identifyAgent } from '@/analytics/posthog'

interface ProvidersProps {
  children: React.ReactNode
  userId: string
  name: string
  email?: string
  orgId: string
}

export function Providers({ children, userId, name, email, orgId }: ProvidersProps) {
  useEffect(() => { initPostHog() }, [])
  useEffect(() => {
    identifyAgent({ userId, name, email, orgId })
  }, [userId, name, email, orgId])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
