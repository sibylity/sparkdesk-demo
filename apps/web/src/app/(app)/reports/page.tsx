import { withAuth } from '@workos-inc/authkit-nextjs'
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
      style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
    >
      <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
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
  await withAuth({ ensureSignedIn: true })
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

  const recentTickets = tickets.slice(0, 10)

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[16px] font-semibold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>
          Reports
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          {tickets.length} total tickets
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard label="Open" value={open} accent="var(--accent-color)" />
        <StatCard label="In Progress" value={inProgress} />
        <StatCard label="Resolved" value={resolved} accent="var(--resolved)" />
        <StatCard label="Urgent" value={urgent} accent="var(--urgent)" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By status */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Tickets by Status
            </h2>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {byStatus.map((row) => (
                <tr key={row.label} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 px-5" style={{ color: 'var(--text-secondary)' }}>{row.label}</td>
                  <td className="py-2.5 px-5 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent tickets */}
        <div
          className="rounded-lg overflow-hidden"
          style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
        >
          <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h2 className="text-[13.5px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Tickets
            </h2>
          </div>
          <table className="w-full text-[13px]">
            <tbody>
              {recentTickets.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-2.5 px-5 max-w-0 truncate" style={{ color: 'var(--text-primary)', width: '55%' }}>
                    {t.subject}
                  </td>
                  <td className="py-2.5 px-5" style={{ color: 'var(--text-muted)' }}>{t.customer.name}</td>
                  <td className="py-2.5 px-5 text-right" style={{ color: 'var(--text-secondary)' }}>
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
