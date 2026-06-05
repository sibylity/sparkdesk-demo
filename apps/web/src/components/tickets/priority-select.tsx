'use client'
import { useTransition } from 'react'
import type { TicketPriority } from '@sparkdesk/shared'

const priorities: { value: TicketPriority; label: string; color: string }[] = [
  { value: 'urgent', label: 'Urgent', color: 'var(--urgent)' },
  { value: 'high',   label: 'High',   color: 'var(--waiting)' },
  { value: 'normal', label: 'Normal', color: 'var(--border-strong)' },
  { value: 'low',    label: 'Low',    color: 'var(--border-strong)' },
]

interface PrioritySelectProps {
  priority: TicketPriority
  onPriorityChange: (priority: TicketPriority) => Promise<void>
}

export function PrioritySelect({ priority, onPriorityChange }: PrioritySelectProps) {
  const [isPending, startTransition] = useTransition()
  const current = priorities.find((p) => p.value === priority)!

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block"
        style={{ background: current.color }}
      />
      <select
        value={priority}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.value as TicketPriority
          startTransition(() => onPriorityChange(next))
        }}
        className="appearance-none cursor-pointer border-none bg-transparent text-[12px] font-semibold outline-none"
        style={{ color: current.color }}
      >
        {priorities.map((p) => (
          <option key={p.value} value={p.value} style={{ background: '#151C24' }}>
            {p.label}
          </option>
        ))}
      </select>
    </div>
  )
}
