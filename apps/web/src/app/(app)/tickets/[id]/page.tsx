import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Clock } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { getCurrentAgentId } from '@/lib/current-agent'
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

type TicketWithCustomer = Ticket & { customer: Customer }
type TicketDetail = Ticket & {
  customer: Customer
  messages: TicketMessage[]
  notes: (TicketNote & { agent: { name: string } | null })[]
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const agentId = await getCurrentAgentId()

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
    await apiClient.tickets.reply(DEMO_ORG_ID, agentId, id, { body })
    revalidatePath(`/tickets/${id}`)
  }

  async function handleNote(body: string) {
    'use server'
    await apiClient.tickets.addNote(DEMO_ORG_ID, agentId, id, { body })
    revalidatePath(`/tickets/${id}`)
  }

  async function handleResolve() {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { status: 'resolved' })
    revalidatePath(`/tickets/${id}`)
    revalidatePath('/tickets')
  }

  async function handlePriorityChange(priority: TicketPriority) {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { priority })
    revalidatePath(`/tickets/${id}`)
    revalidatePath('/tickets')
  }

  async function handleAssign(agentId: string | null) {
    'use server'
    await apiClient.tickets.update(DEMO_ORG_ID, id, { assigneeId: agentId })
    revalidatePath(`/tickets/${id}`)
    revalidatePath('/tickets')
  }

  return (
    <div className="flex h-full">
      <TicketList tickets={tickets} selectedId={id} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex items-start justify-between gap-5 px-8 py-5"
          style={{
            borderBottom: '1px solid var(--border)',
            background: 'color-mix(in srgb, var(--bg-panel) 70%, transparent)',
          }}
        >
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="page-kicker">Ticket</span>
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                #{ticket.id.slice(0, 8)}
              </span>
            </div>
            <h1
              className="mb-2 max-w-[820px] truncate text-[22px] font-[760] leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {ticket.subject}
            </h1>
            <div className="flex flex-wrap items-center gap-2.5 text-[12px]" style={{ color: 'var(--text-muted)' }}>
              <PrioritySelect priority={ticket.priority} onPriorityChange={handlePriorityChange} />
              <StatusTag status={ticket.status} />
              <span style={{ color: 'var(--border-strong)' }}>/</span>
              <span>{ticket.customer.company ?? ticket.customer.name}</span>
              <span style={{ color: 'var(--border-strong)' }}>/</span>
              <span>{ticket.customer.name}</span>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2 pt-2">
            <AssignDropdown agents={agents} assigneeId={ticket.assigneeId} onAssign={handleAssign} />
            <Button variant="outline" size="sm">
              <Clock aria-hidden="true" />
              Snooze
            </Button>
            <ResolveButton onResolve={handleResolve} isResolved={ticket.status === 'resolved'} />
          </div>
        </div>

        <TicketThread items={threadItems} />
        <ReplyBox ticketId={id} onReply={handleReply} onNote={handleNote} />
      </div>
    </div>
  )
}
