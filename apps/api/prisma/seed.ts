import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Organization
  const org = await db.organization.upsert({
    where: { workosOrganizationId: 'demo-org' },
    create: {
      name: 'SparkDesk Demo',
      workosOrganizationId: 'demo-org',
      plan: 'pro',
    },
    update: {},
  })
  console.log('Org:', org.id)

  // Agent
  const agent = await db.agent.upsert({
    where: { workosUserId: 'demo-agent' },
    create: {
      name: 'Jamie Diaz',
      email: 'jamie@sparkdesk.demo',
      role: 'admin',
      workosUserId: 'demo-agent',
      organizationId: org.id,
    },
    update: {},
  })
  console.log('Agent:', agent.id)

  // Customers
  const customers = await Promise.all([
    db.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: 'sarah@acmecorp.com' } },
      create: { name: 'Sarah Chen', email: 'sarah@acmecorp.com', company: 'Acme Corp', organizationId: org.id },
      update: {},
    }),
    db.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: 'marcus@globaltech.io' } },
      create: { name: 'Marcus Webb', email: 'marcus@globaltech.io', company: 'GlobalTech', organizationId: org.id },
      update: {},
    }),
    db.customer.upsert({
      where: { organizationId_email: { organizationId: org.id, email: 'priya@northstar.co' } },
      create: { name: 'Priya Patel', email: 'priya@northstar.co', company: 'Northstar', organizationId: org.id },
      update: {},
    }),
  ])

  // Tickets with realistic threads
  await db.ticket.create({
    data: {
      subject: "Can't export billing data",
      status: 'in_progress',
      priority: 'urgent',
      channel: 'web',
      organizationId: org.id,
      customerId: customers[0]!.id,
      assigneeId: agent.id,
      messages: {
        create: [
          {
            body: "Hi — we're trying to pull our Q2 invoices but the CSV export keeps timing out after about 30 seconds. We have around 800 invoices. Is there a row limit?",
            authorType: 'customer',
          },
          {
            body: "Hi Sarah — thanks for flagging this. You've hit a known issue with large date range exports. As a workaround, try exporting in 30-day chunks. We have a fix shipping this week.",
            authorType: 'agent',
            agentId: agent.id,
          },
          {
            body: "The chunked export worked — thank you! Looking forward to the fix.",
            authorType: 'customer',
          },
        ],
      },
      notes: {
        create: {
          body: "Checked the logs — query timeout on large date ranges. Known issue, fix is in staging. ETA this week.",
          agentId: agent.id,
        },
      },
    },
  })

  await db.ticket.create({
    data: {
      subject: 'Slack integration not syncing',
      status: 'open',
      priority: 'high',
      channel: 'slack',
      organizationId: org.id,
      customerId: customers[1]!.id,
      messages: {
        create: {
          body: "New replies from agents aren't appearing in our #support Slack channel. Messages send fine from the SparkDesk UI but nothing shows up on our end.",
          authorType: 'customer',
        },
      },
    },
  })

  await db.ticket.create({
    data: {
      subject: 'How do I add a second workspace?',
      status: 'waiting_on_customer',
      priority: 'normal',
      channel: 'web',
      organizationId: org.id,
      customerId: customers[2]!.id,
      messages: {
        create: [
          {
            body: "We're expanding to a new region and need a separate support workspace. Is that possible on the Pro plan?",
            authorType: 'customer',
          },
          {
            body: "Yes, multiple workspaces are available on Pro. Could you confirm whether you need a completely separate org or just a separate inbox view?",
            authorType: 'agent',
            agentId: agent.id,
          },
        ],
      },
    },
  })

  await db.ticket.create({
    data: {
      subject: 'API rate limit questions',
      status: 'resolved',
      priority: 'normal',
      channel: 'api',
      organizationId: org.id,
      customerId: customers[0]!.id,
      assigneeId: agent.id,
      messages: {
        create: [
          { body: "What are the rate limits on the v1 API for the Pro plan?", authorType: 'customer' },
          { body: "Pro plan is 1,000 requests/minute per org. Let me know if you need higher limits — we can discuss custom arrangements.", authorType: 'agent', agentId: agent.id },
          { body: "Perfect, that's plenty for our use case. Thanks!", authorType: 'customer' },
        ],
      },
    },
  })

  await db.ticket.create({
    data: {
      subject: 'Custom SLA configuration',
      status: 'open',
      priority: 'normal',
      channel: 'web',
      organizationId: org.id,
      customerId: customers[1]!.id,
      messages: {
        create: {
          body: "Is it possible to set different SLA response windows based on ticket priority? We want urgent tickets to have a 1-hour SLA and normal tickets 24 hours.",
          authorType: 'customer',
        },
      },
    },
  })

  console.log('\nSeeded successfully.')
  console.log(`DEMO_ORG_ID=${org.id}`)
  console.log(`DEMO_AGENT_ID=${agent.id}`)
}

main().catch(console.error).finally(() => db.$disconnect())
