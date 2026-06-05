import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api-client'
import { DemoLauncher } from '@/components/demo/demo-launcher'
import type { Customer } from '@sparkdesk/shared'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function DemoPage() {
  const customers = await apiClient.customers.list(DEMO_ORG_ID) as Customer[]

  async function injectTicket(scenarioId: string, customerId: string) {
    'use server'
    const scenario = SCENARIOS.find((s) => s.id === scenarioId)
    if (!scenario) return
    await apiClient.tickets.create(DEMO_ORG_ID, {
      subject: scenario.subject,
      body: scenario.body,
      priority: scenario.priority,
      channel: scenario.channel,
      customerId,
    })
    revalidatePath('/inbox')
    revalidatePath('/tickets')
  }

  return <DemoLauncher customers={customers} onInject={injectTicket} />
}

const SCENARIOS = [
  {
    id: 'billing-dispute',
    label: 'Billing dispute',
    tag: 'Urgent · Email',
    subject: 'I was charged twice for my subscription this month',
    body: "Hi, I just noticed two charges of $499 on my credit card statement for SparkDesk — both dated today. This is clearly a billing error and I need it resolved immediately. We've been a customer for 2 years and this is unacceptable. Please refund the duplicate charge and confirm it won't happen again.",
    priority: 'urgent' as const,
    channel: 'email' as const,
  },
  {
    id: 'integration-broken',
    label: 'Slack integration down',
    tag: 'High · Web',
    subject: 'Slack notifications stopped working after your update',
    body: "Since your maintenance window last night, we're no longer receiving ticket notifications in our #support-alerts Slack channel. Our team relies on these to respond quickly. The integration still shows as connected in Settings. Can you look into this?",
    priority: 'high' as const,
    channel: 'web' as const,
  },
  {
    id: 'export-bug',
    label: 'CSV export broken',
    tag: 'High · Web',
    subject: 'CSV export is downloading an empty file',
    body: "When I click 'Export tickets' from the Reports page, I get a CSV file with only a header row — no data. I've tried filtering different date ranges and it's always empty. I need this for an executive review tomorrow. Using Chrome 124 on macOS.",
    priority: 'high' as const,
    channel: 'web' as const,
  },
  {
    id: 'admin-access',
    label: 'Admin access question',
    tag: 'Normal · Email',
    subject: 'How do I give my colleague admin access?',
    body: "We just hired a new support manager and I need to give her admin access so she can configure team settings and SLA rules. In the Team section I can only see 'agent' in the role dropdown. Is admin something we need to upgrade for, or am I missing something?",
    priority: 'normal' as const,
    channel: 'email' as const,
  },
  {
    id: 'feature-request',
    label: 'Business hours routing',
    tag: 'Normal · Web',
    subject: 'Can you add business hours for auto-routing?',
    body: "Our support team works Mon–Fri 9am–6pm ET. Tickets coming in overnight get assigned to agents who are off duty. It'd be great if SparkDesk could hold overnight tickets and only assign them when business hours start. Is this on your roadmap?",
    priority: 'normal' as const,
    channel: 'web' as const,
  },
  {
    id: 'security-alert',
    label: 'Suspicious login',
    tag: 'Urgent · Email',
    subject: 'Someone may have accessed my account without permission',
    body: "I received a login notification from an IP I don't recognize — it's in a different country. I changed my password immediately, but I'm worried my ticket data and customer info may have been viewed. Can you tell me what was accessed during that session and what steps I should take?",
    priority: 'urgent' as const,
    channel: 'email' as const,
  },
]
