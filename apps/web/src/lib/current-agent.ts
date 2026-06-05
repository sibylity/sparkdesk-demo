import { cache } from 'react'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from './api-client'
import type { Agent } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo-org'
const FALLBACK_AGENT_ID = process.env.DEMO_AGENT_ID ?? 'demo-agent'

// Deduped per request via React cache — safe to call from multiple server components
export const getCurrentAgentId = cache(async (): Promise<string> => {
  try {
    const { user } = await withAuth()
    if (!user) return FALLBACK_AGENT_ID
    const agents = await apiClient.agents.list(DEMO_ORG_ID) as Agent[]
    return agents.find((a) => a.workosUserId === user.id)?.id ?? FALLBACK_AGENT_ID
  } catch {
    return FALLBACK_AGENT_ID
  }
})
