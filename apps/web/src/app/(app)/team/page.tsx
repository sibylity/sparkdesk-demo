import { withAuth } from '@workos-inc/authkit-nextjs'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { AgentTable } from '@/components/team/agent-table'
import type { Agent, AgentRole } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function TeamPage() {
  await withAuth({ ensureSignedIn: true })
  const agents = await apiClient.agents.list(DEMO_ORG_ID) as Agent[]

  async function handleRoleChange(agentId: string, role: AgentRole) {
    'use server'
    await apiClient.agents.update(DEMO_ORG_ID, agentId, { role })
    revalidatePath('/team')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[16px] font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Team
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {agents.length} member{agents.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div
        className="rounded-lg overflow-hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
      >
        <AgentTable agents={agents} onRoleChange={handleRoleChange} />
      </div>
    </div>
  )
}
