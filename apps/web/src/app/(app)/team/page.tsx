import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { AgentTable } from '@/components/team/agent-table'
import type { Agent, AgentRole } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function TeamPage() {
  const agents = await apiClient.agents.list(DEMO_ORG_ID) as Agent[]

  async function handleRoleChange(agentId: string, role: AgentRole) {
    'use server'
    await apiClient.agents.update(DEMO_ORG_ID, agentId, { role })
    revalidatePath('/team')
  }

  return (
    <div className="app-page">
      <div className="mb-6">
        <div className="page-kicker">Workspace</div>
        <h1 className="page-title mt-1">Team</h1>
        <p className="page-copy mt-1">
          {agents.length} member{agents.length !== 1 ? 's' : ''}
        </p>
      </div>
      <div className="surface overflow-hidden">
        <AgentTable agents={agents} onRoleChange={handleRoleChange} />
      </div>
    </div>
  )
}
