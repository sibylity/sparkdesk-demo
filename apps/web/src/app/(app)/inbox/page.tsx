import { revalidatePath } from 'next/cache'
import { ArrowLeft, Inbox } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { getCurrentAgentId } from '@/lib/current-agent'
import { TicketList } from '@/components/tickets/ticket-list'
import { TipBanner } from '@/components/common/tip-banner'
import { FEATURE_TIPS } from '@/lib/tips'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function InboxPage() {
  const agentId = await getCurrentAgentId()

  const [tickets, agents] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID) as Promise<(Ticket & { customer: Customer })[]>,
    apiClient.agents.list(DEMO_ORG_ID) as Promise<{ id: string; dismissedTips: string[] }[]>,
  ])

  const currentAgent = agents.find((a) => a.id === agentId)
  const showInboxTip = !currentAgent?.dismissedTips?.includes('inbox_filters_tip')

  async function dismissInboxTip() {
    'use server'
    const id = await getCurrentAgentId()
    await apiClient.agents.dismissTip(DEMO_ORG_ID, id, 'inbox_filters_tip')
    revalidatePath('/inbox')
  }

  const tip = FEATURE_TIPS.inbox_filters_tip

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {showInboxTip && (
        <TipBanner
          tipId={tip.id}
          title={tip.title}
          body={tip.body}
          onDismiss={dismissInboxTip}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <TicketList tickets={tickets} />
        <div
          className="flex flex-1 items-center justify-center px-8"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="max-w-sm text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
            >
              <Inbox className="size-5" style={{ color: 'var(--accent-color)' }} aria-hidden="true" />
            </div>
            <div className="mb-2 flex items-center justify-center gap-2 text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Choose a conversation
            </div>
            <h2 className="text-[20px] font-[760]" style={{ color: 'var(--text-primary)' }}>
              Your queue is ready
            </h2>
            <p className="mt-2 text-[13px] leading-6" style={{ color: 'var(--text-muted)' }}>
              Pick a ticket from the left to review context, reply to the customer, or leave an internal note.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
