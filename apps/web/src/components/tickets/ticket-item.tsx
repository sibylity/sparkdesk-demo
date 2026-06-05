'use client'
import Link from 'next/link'
import { StatusTag, PriorityDot } from './status-badge'
import { trackTicketOpened } from '@/analytics/events'
import type { Ticket, Customer } from '@sparkdesk/shared'

interface TicketItemProps {
  ticket: Ticket & { customer: Customer }
  selected?: boolean
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function TicketItem({ ticket, selected }: TicketItemProps) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      onClick={() => trackTicketOpened({ ticketId: ticket.id, ticketStatus: ticket.status, ticketPriority: ticket.priority })}
      className="relative mb-1 block cursor-pointer rounded-lg border px-3.5 py-3 transition-colors"
      style={{
        borderColor: selected ? 'var(--accent-border)' : 'transparent',
        background: selected ? 'var(--bg-selected)' : 'transparent',
      }}
    >
      {selected && (
        <div
          className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full"
          style={{ background: 'var(--accent-color)' }}
        />
      )}
      <div className="mb-2 flex items-start justify-between gap-3">
        <span
          className="min-w-0 flex-1 truncate text-[13.5px] font-[680] leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {ticket.subject}
        </span>
        <span className="flex-shrink-0 text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PriorityDot priority={ticket.priority} />
        <span className="min-w-0 flex-1 truncate text-[12px]">
          <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
            {ticket.customer.name}
          </span>
          {ticket.customer.company && (
            <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
              {' · '}{ticket.customer.company}
            </span>
          )}
        </span>
        <StatusTag status={ticket.status} />
      </div>
    </Link>
  )
}
