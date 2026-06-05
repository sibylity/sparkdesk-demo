import { apiClient } from '@/lib/api-client'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

type TicketWithCustomer = Ticket & { customer: Customer }

interface StatCardProps {
  label: string
  value: number
  accent?: string
}

function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        border: '1px solid var(--border)',
        background: 'linear-gradient(180deg, var(--bg-raised), var(--bg-surface))',
        boxShadow: 'var(--shadow-soft)',
      }}
    >
      <p className="mb-3 text-[11px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p
        className="text-[28px] font-[650] tracking-tight leading-none"
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {value}
      </p>
    </div>
  )
}

export default async function ReportsPage() {
  const tickets = await apiClient.tickets.list(DEMO_ORG_ID) as TicketWithCustomer[]

  const open = tickets.filter((t) => t.status === 'open').length
  const inProgress = tickets.filter((t) => t.status === 'in_progress').length
  const resolved = tickets.filter((t) => t.status === 'resolved').length
  const urgent = tickets.filter((t) => t.priority === 'urgent').length

  const byStatus = [
    { label: 'Open', count: open },
    { label: 'In Progress', count: inProgress },
    { label: 'Waiting', count: tickets.filter((t) => t.status === 'waiting_on_customer').length },
    { label: 'Resolved', count: resolved },
    { label: 'Closed', count: tickets.filter((t) => t.status === 'closed').length },
  ]

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)

  return (
    <div className="app-page">
      <div className="mb-6">
        <div className="page-kicker">Performance</div>
        <h1 className="page-title mt-1">Reports</h1>
        <p className="page-copy mt-1">
          {tickets.length} total tickets
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Open" value={open} accent="var(--accent-color)" />
        <StatCard label="In Progress" value={inProgress} />
        <StatCard label="Resolved" value={resolved} accent="var(--resolved)" />
        <StatCard label="Urgent" value={urgent} accent="var(--urgent)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="surface overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Tickets by Status
            </h2>
          </div>
          <table className="data-table">
            <tbody>
              {byStatus.map((row) => (
                <tr key={row.label}>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                  <td className="text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="surface overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Tickets
            </h2>
          </div>
          <table className="data-table">
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id}>
                  <td className="max-w-0 truncate font-semibold" style={{ color: 'var(--text-primary)', width: '55%' }}>
                    {t.subject}
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{t.customer.name}</td>
                  <td className="text-right" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
