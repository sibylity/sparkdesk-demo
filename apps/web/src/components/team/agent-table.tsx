'use client'
import { useTransition } from 'react'
import type { Agent, AgentRole } from '@sparkdesk/shared'

interface AgentTableProps {
  agents: Agent[]
  onRoleChange: (agentId: string, role: AgentRole) => Promise<void>
}

export function AgentTable({ agents, onRoleChange }: AgentTableProps) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <AgentRow key={agent.id} agent={agent} onRoleChange={onRoleChange} />
        ))}
      </tbody>
    </table>
  )
}

function AgentRow({ agent, onRoleChange }: { agent: Agent; onRoleChange: (agentId: string, role: AgentRole) => Promise<void> }) {
  const [isPending, startTransition] = useTransition()

  return (
    <tr>
      <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{agent.name}</td>
      <td style={{ color: 'var(--text-secondary)' }}>{agent.email}</td>
      <td>
        <select
          value={agent.role}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value as AgentRole
            startTransition(() => onRoleChange(agent.id, next))
          }}
          className="cursor-pointer rounded-lg border px-2 py-1 text-[12px] font-semibold"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg)' }}
        >
          <option value="agent" style={{ background: '#151C24' }}>Agent</option>
          <option value="admin" style={{ background: '#151C24' }}>Admin</option>
        </select>
      </td>
    </tr>
  )
}
