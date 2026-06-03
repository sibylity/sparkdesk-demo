import type { TicketStatus, TicketPriority } from '@sparkdesk/shared'

const statusColors: Record<TicketStatus, string> = {
  open: 'var(--accent-color)',
  in_progress: 'var(--accent-color)',
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
    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: statusColors[status] }}>
      {statusLabels[status]}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className="w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block"
      style={{ background: priorityColors[priority] }}
    />
  )
}
