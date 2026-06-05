'use client'
import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TicketItem } from './ticket-item'
import { FilterPills } from './filter-pills'
import type { Ticket, Customer, TicketStatus } from '@sparkdesk/shared'

type TicketWithCustomer = Ticket & { customer: Customer }

const filters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
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
  const [query, setQuery] = useState('')

  const statusFiltered =
    activeFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === activeFilter)

  const filtered = query
    ? statusFiltered.filter((ticket) => {
        const haystack = `${ticket.subject} ${ticket.customer.name} ${ticket.customer.email} ${ticket.customer.company ?? ''}`
        return haystack.toLowerCase().includes(query.toLowerCase())
      })
    : statusFiltered

  const openCount = tickets.filter((t) => t.status === 'open').length

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{
        width: 360,
        borderRight: '1px solid var(--border-panel)',
        background: 'color-mix(in srgb, var(--bg-panel) 72%, transparent)',
      }}
    >
      <div className="px-4 pb-3 pt-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <div className="page-kicker">Live Queue</div>
            <h1 className="mt-1 text-[20px] font-[760] leading-none" style={{ color: 'var(--text-primary)' }}>
              Inbox
            </h1>
          </div>
          <div
            className="rounded-lg px-2.5 py-1.5 text-right"
            style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-border)' }}
          >
            <div className="text-[15px] font-bold leading-none" style={{ color: 'var(--accent-strong)' }}>
              {openCount}
            </div>
            <div className="mt-0.5 text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
              Open
            </div>
          </div>
        </div>
        <Button size="sm" className="w-full">
          <Plus aria-hidden="true" />
          New ticket
        </Button>
      </div>

      <div className="px-4 pb-3">
        <div
          className="mb-3 flex h-8 items-center gap-2 rounded-lg border px-2.5"
          style={{ background: 'var(--bg-raised)' }}
        >
          <Search className="size-3.5" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search queue"
            className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
        </div>
      </div>

      <div className="px-4 pb-3">
        <FilterPills
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2">
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
