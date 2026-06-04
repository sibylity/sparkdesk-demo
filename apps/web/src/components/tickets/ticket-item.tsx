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
      className="block px-4 py-[11px] border-b relative cursor-pointer transition-colors"
      style={{
        borderColor: 'var(--border)',
        background: selected ? 'var(--bg-selected)' : 'transparent',
      }}
    >
      {selected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: 'var(--accent-color)' }}
        />
      )}
      <div className="flex items-center justify-between gap-2 mb-[3px]">
        <span
          className="text-[13px] font-[560] truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {ticket.subject}
        </span>
        <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <PriorityDot priority={ticket.priority} />
        <span
          className="text-[12px] truncate flex-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {ticket.customer.name}
        </span>
        <StatusTag status={ticket.status} />
      </div>
    </Link>
  )
}
