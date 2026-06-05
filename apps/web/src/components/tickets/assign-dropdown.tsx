'use client'
import { useTransition } from 'react'
import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Agent } from '@sparkdesk/shared'

interface AssignDropdownProps {
  agents: Agent[]
  assigneeId: string | null
  onAssign: (agentId: string | null) => Promise<void>
}

export function AssignDropdown({ agents, assigneeId, onAssign }: AssignDropdownProps) {
  const [isPending, startTransition] = useTransition()
  const current = agents.find((a) => a.id === assigneeId)

  return (
    <div className="relative flex items-center">
      <select
        value={assigneeId ?? ''}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value || null
          startTransition(() => onAssign(next))
        }}
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        aria-label="Assign agent"
      >
        <option value="">Unassigned</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <Button variant="outline" size="sm" disabled={isPending}>
        <UserPlus aria-hidden="true" />
        {isPending ? 'Assigning…' : current ? current.name : 'Assign'}
      </Button>
    </div>
  )
}
