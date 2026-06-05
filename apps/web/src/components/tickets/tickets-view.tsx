'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { StatusTag, PriorityDot } from './status-badge'
import { FilterPills } from './filter-pills'
import type { Ticket, Customer, Agent, TicketStatus } from '@sparkdesk/shared'

type TicketRow = Ticket & { customer: Customer; assignee: Agent | null }

const STATUS_FILTERS: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Waiting', value: 'waiting_on_customer' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

interface TicketsViewProps {
  tickets: TicketRow[]
  agents: Agent[]
  mode: 'all' | 'mine'
}

export function TicketsView({ tickets, mode }: TicketsViewProps) {
  const [activeStatus, setActiveStatus] = useState<TicketStatus | 'all'>('open')
  const [query, setQuery] = useState('')

  const statusFiltered =
    activeStatus === 'all' ? tickets : tickets.filter((t) => t.status === activeStatus)

  const filtered = query
    ? statusFiltered.filter((t) => {
        const hay = `${t.subject} ${t.customer.name} ${t.customer.company ?? ''} ${t.assignee?.name ?? ''}`
        return hay.toLowerCase().includes(query.toLowerCase())
      })
    : statusFiltered

  const counts = Object.fromEntries([
    ...STATUS_FILTERS.filter((f) => f.value !== 'all').map((f) => [
      f.value,
      tickets.filter((t) => t.status === f.value).length,
    ]),
    ['all', tickets.length],
  ]) as Partial<Record<TicketStatus | 'all', number>>

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className="flex-shrink-0 px-8 pb-4 pt-7"
        style={{ borderBottom: '1px solid var(--border-panel)' }}
      >
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <div className="page-kicker">{mode === 'mine' ? 'My queue' : 'Archive'}</div>
            <h1 className="page-title mt-1">{mode === 'mine' ? 'My Tickets' : 'All Tickets'}</h1>
          </div>
          <div
            className="flex h-8 items-center gap-2 rounded-lg border px-2.5"
            style={{ background: 'var(--bg-raised)', minWidth: 220 }}
          >
            <Search className="size-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} aria-hidden />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tickets…"
              className="min-w-0 flex-1 bg-transparent text-[12px] outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <FilterPills
          filters={STATUS_FILTERS}
          activeFilter={activeStatus}
          onFilterChange={setActiveStatus}
          counts={counts}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto px-8 py-4">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No tickets
          </p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                <th className="pb-2 pr-4">Subject</th>
                <th className="pb-2 pr-4 w-[180px]">Customer</th>
                <th className="pb-2 pr-4 w-[110px]">Status</th>
                <th className="pb-2 pr-4 w-[100px]">Priority</th>
                <th className="pb-2 pr-4 w-[130px]">Assignee</th>
                <th className="pb-2 w-[48px] text-right">Age</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="group border-t transition-colors"
                  style={{ borderColor: 'var(--border-panel)' }}
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/tickets/${ticket.id}`}
                      className="block min-w-0 truncate text-[13px] font-[620] transition-colors"
                      style={{ color: 'var(--text-primary)', maxWidth: 380 }}
                    >
                      {ticket.subject}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="block truncate text-[12px]">
                      <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                        {ticket.customer.name}
                      </span>
                      {ticket.customer.company && (
                        <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
                          {' · '}{ticket.customer.company}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <StatusTag status={ticket.status} />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-1.5">
                      <PriorityDot priority={ticket.priority} />
                      <span className="text-[12px] capitalize" style={{ color: 'var(--text-secondary)' }}>
                        {ticket.priority}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="truncate text-[12px]" style={{ color: 'var(--text-secondary)' }}>
                      {ticket.assignee?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </span>
                  </td>
                  <td className="py-3 text-right text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                    {timeAgo(ticket.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
