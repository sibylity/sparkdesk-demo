'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TicketItem } from './ticket-item'
import type { Ticket, Customer, TicketStatus } from '@sparkdesk/shared'
import { trackInboxFilterApplied } from '@/analytics/events'

type TicketWithCustomer = Ticket & { customer: Customer }

const filters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Waiting', value: 'waiting_on_customer' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

interface TicketListProps {
  tickets: TicketWithCustomer[]
  selectedId?: string
}

export function TicketList({ tickets, selectedId }: TicketListProps) {
  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'all'>('open')

  const filtered =
    activeFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === activeFilter)

  return (
    <div
      className="flex flex-col border-r overflow-hidden"
      style={{ width: 320, borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-[13.5px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Inbox
        </span>
        <Button size="sm">New ticket</Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 px-4 pb-3">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => {
              setActiveFilter(f.value)
              trackInboxFilterApplied({
                filterType: 'status',
                filterValue: f.value,
              })
            }}
            className="px-2.5 py-[3px] rounded text-[12px] font-medium transition-colors border-none"
            style={{
              background: activeFilter === f.value ? 'var(--bg-surface)' : 'transparent',
              color: activeFilter === f.value ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No tickets
          </p>
        ) : (
          filtered.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} selected={ticket.id === selectedId} />
          ))
        )}
      </div>
    </div>
  )
}
