import { withAuth } from '@workos-inc/authkit-nextjs'
import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { TicketList } from '@/components/tickets/ticket-list'
import { TipBanner } from '@/components/common/tip-banner'
import { FEATURE_TIPS } from '@/lib/tips'
import type { Ticket, Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? ''

export default async function InboxPage() {
  await withAuth({ ensureSignedIn: true })

  const [tickets, agents] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID) as Promise<(Ticket & { customer: Customer })[]>,
    apiClient.agents.list(DEMO_ORG_ID) as Promise<{ id: string; dismissedTips: string[] }[]>,
  ])

  const currentAgent = agents.find((a) => a.id === DEMO_AGENT_ID)
  const showInboxTip = !currentAgent?.dismissedTips?.includes('inbox_filters_tip')

  async function dismissInboxTip() {
    'use server'
    await apiClient.dismissTip(DEMO_ORG_ID, DEMO_AGENT_ID, 'inbox_filters_tip')
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
          className="flex-1 flex items-center justify-center"
          style={{ color: 'var(--text-muted)' }}
        >
          <p className="text-sm">Select a ticket</p>
        </div>
      </div>
    </div>
  )
}
