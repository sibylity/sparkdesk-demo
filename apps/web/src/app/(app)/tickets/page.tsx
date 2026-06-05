import { apiClient } from '@/lib/api-client'
import { getCurrentAgentId } from '@/lib/current-agent'
import { TicketsView } from '@/components/tickets/tickets-view'
import type { Ticket, Customer, Agent } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

type TicketWithRelations = Ticket & { customer: Customer; assignee: Agent | null }

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const myTickets = params.assignee === 'me'
  const agentId = await getCurrentAgentId()

  const [tickets, agents] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID, myTickets ? { assigneeId: agentId } : undefined) as Promise<TicketWithRelations[]>,
    apiClient.agents.list(DEMO_ORG_ID) as Promise<Agent[]>,
  ])

  return (
    <TicketsView
      tickets={tickets}
      agents={agents}
      mode={myTickets ? 'mine' : 'all'}
    />
  )
}
