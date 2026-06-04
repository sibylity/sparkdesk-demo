'use client'
import { useTransition } from 'react'
import type { Agent, AgentRole } from '@sparkdesk/shared'

interface AgentTableProps {
  agents: Agent[]
  onRoleChange: (agentId: string, role: AgentRole) => Promise<void>
}

export function AgentTable({ agents, onRoleChange }: AgentTableProps) {
  return (
    <table className="w-full text-[13px]">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Name</th>
          <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Email</th>
          <th className="text-left py-2 px-4 font-medium" style={{ color: 'var(--text-muted)' }}>Role</th>
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
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td className="py-3 px-4" style={{ color: 'var(--text-primary)' }}>{agent.name}</td>
      <td className="py-3 px-4" style={{ color: 'var(--text-secondary)' }}>{agent.email}</td>
      <td className="py-3 px-4">
        <select
          value={agent.role}
          disabled={isPending}
          onChange={(e) => {
            const next = e.target.value as AgentRole
            startTransition(() => onRoleChange(agent.id, next))
          }}
          className="text-[12px] px-2 py-1 rounded border bg-transparent cursor-pointer"
          style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)', background: 'var(--bg-surface)' }}
        >
          <option value="agent" style={{ background: '#131316' }}>Agent</option>
          <option value="admin" style={{ background: '#131316' }}>Admin</option>
        </select>
      </td>
    </tr>
  )
}
