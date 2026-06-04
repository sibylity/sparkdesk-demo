import { notFound } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { TicketList } from '@/components/tickets/ticket-list'
import { TicketThread, buildThreadItems } from '@/components/tickets/ticket-thread'
import { ReplyBox } from '@/components/tickets/reply-box'
import { ResolveButton } from '@/components/tickets/resolve-button'
import { StatusTag } from '@/components/tickets/status-badge'
import { PrioritySelect } from '@/components/tickets/priority-select'
import { AssignDropdown } from '@/components/tickets/assign-dropdown'
import type { Ticket, Customer, TicketMessage, TicketNote, TicketPriority, Agent } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? ''

type TicketWithCustomer = Ticket & { customer: Customer }
type TicketDetail = Ticket & {
  customer: Customer
  messages: TicketMessage[]
  notes: (TicketNote & { agent: { name: string } | null })[]
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await withAuth({ ensureSignedIn: true })

  const [tickets, ticket, agents] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID) as Promise<TicketWithCustomer[]>,
    apiClient.tickets.get(DEMO_ORG_ID, id) as Promise<TicketDetail | null>,
    apiClient.agents.list(DEMO_ORG_ID) as Promise<Agent[]>,
  ])

  if (!ticket) notFound()

  const agentNames: Record<string, string> = {}
  for (const m of ticket.messages) {
    if (m.authorType === 'agent') {
      agentNames[m.authorId] = agentNames[m.authorId] ?? 'Agent'
    }
  }

  const threadItems = buildThreadItems(
    ticket.messages,
    ticket.notes,
    ticket.customer.name,
    agentNames
  )

  async function handleReply(body: string) {
    'use server'
    await apiClient.tickets.reply(DEMO_ORG_ID, DEMO_AGENT_ID, id, { body })
    revalidatePath(`/tickets/${id}`)
  }

  async function handleNote(body: string) {
    'use server'
    await apiClient.tickets.addNote(DEMO_ORG_ID, DEMO_AGENT_ID, id, { body })
    revalidatePath(`/tickets/${id}`)
  }

  async function handleResolve() {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { status: 'resolved' })
    revalidatePath(`/tickets/${id}`)
  }

  async function handlePriorityChange(priority: TicketPriority) {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { priority })
    revalidatePath(`/tickets/${id}`)
  }

  async function handleAssign(agentId: string | null) {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { assigneeId: agentId })
    revalidatePath(`/tickets/${id}`)
  }

  return (
    <div className="flex h-full">
      <TicketList tickets={tickets} selectedId={id} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="px-6 py-4 flex items-start justify-between gap-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h1
              className="text-[14.5px] font-[650] tracking-tight mb-1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              {ticket.subject}
            </h1>
            <div className="flex items-center gap-2.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <PrioritySelect priority={ticket.priority} onPriorityChange={handlePriorityChange} />
              <StatusTag status={ticket.status} />
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{ticket.customer.company ?? ticket.customer.name}</span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{ticket.customer.name}</span>
            </div>
          </div>
          <div className="flex gap-1.5 pt-0.5">
            <AssignDropdown agents={agents} assigneeId={ticket.assigneeId} onAssign={handleAssign} />
            <Button variant="outline" size="sm">Snooze</Button>
            <ResolveButton onResolve={handleResolve} isResolved={ticket.status === 'resolved'} />
          </div>
        </div>

        <TicketThread items={threadItems} />
        <ReplyBox ticketId={id} onReply={handleReply} onNote={handleNote} />
      </div>
    </div>
  )
}
