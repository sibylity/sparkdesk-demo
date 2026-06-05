import type { TicketStatus, TicketPriority } from '@sparkdesk/shared'

const statusColors: Record<TicketStatus, string> = {
  open: 'var(--accent-color)',
  in_progress: 'var(--violet)',
  waiting_on_customer: 'var(--waiting)',
  resolved: 'var(--resolved)',
  closed: 'var(--text-muted)',
  snoozed: 'var(--text-muted)',
  spam: 'var(--text-muted)',
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_customer: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
  snoozed: 'Snoozed',
  spam: 'Spam',
}

const priorityColors: Record<TicketPriority, string> = {
  urgent: 'var(--urgent)',
  high: 'var(--waiting)',
  normal: 'var(--border-strong)',
  low: 'var(--border-strong)',
}

export function StatusTag({ status }: { status: TicketStatus }) {
  return (
    <span
      className="inline-flex h-5 flex-shrink-0 items-center rounded-full px-2 text-[10.5px] font-bold"
      style={{
        color: statusColors[status],
        background: `color-mix(in srgb, ${statusColors[status]} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${statusColors[status]} 28%, transparent)`,
      }}
    >
      {statusLabels[status]}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
      style={{
        background: priorityColors[priority],
        boxShadow: priority === 'urgent' ? '0 0 0 3px #FF735C1A' : undefined,
      }}
    />
  )
}
