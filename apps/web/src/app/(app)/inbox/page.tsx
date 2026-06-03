import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from '@/lib/api-client'
import { TicketList } from '@/components/tickets/ticket-list'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function InboxPage() {
  await withAuth({ ensureSignedIn: true })

  const tickets = (await apiClient.tickets.list(DEMO_ORG_ID)) as (Ticket & { customer: Customer })[]

  return (
    <div className="flex h-full">
      <TicketList tickets={tickets} />
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <p className="text-sm">Select a ticket</p>
      </div>
    </div>
  )
}
