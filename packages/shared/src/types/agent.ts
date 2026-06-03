export type AgentRole = 'admin' | 'agent'

export interface Agent {
  id: string
  name: string
  email: string
  role: AgentRole
  organizationId: string
  workosUserId: string
  createdAt: string
}
