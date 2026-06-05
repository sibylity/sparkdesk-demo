import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const daysAgo  = (d: number) => new Date(Date.now() - d * 86_400_000)
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000)
const pick = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]!

async function main() {
  // ── Org ──────────────────────────────────────────────────────────────────
  const org = await db.organization.upsert({
    where: { workosOrganizationId: 'demo-org' },
    create: { id: 'demo-org', name: 'SparkDesk Demo', workosOrganizationId: 'demo-org', plan: 'pro' },
    update: {},
  })

  // ── 7 agents (demo-agent = whoever is logged in) ─────────────────────────
  // Use real WorkOS user ID if provided so the logged-in user is recognized as this agent
  const demoWorkosUserId = process.env.DEMO_USER_WORKOS_ID ?? 'demo-agent'
  const jamie = await db.agent.upsert({
    where: { workosUserId: demoWorkosUserId },
    create: { id: 'demo-agent', name: 'Jamie Diaz', email: 'jamie@sparkdesk.demo', role: 'admin', workosUserId: demoWorkosUserId, organizationId: org.id },
    update: { workosUserId: demoWorkosUserId },
  })
  const agentDefs = [
    { workosUserId: 'demo-agent-2', name: 'Sam Okafor',    email: 'sam@sparkdesk.demo',   role: 'agent' as const },
    { workosUserId: 'demo-agent-3', name: 'Remi Torres',   email: 'remi@sparkdesk.demo',  role: 'agent' as const },
    { workosUserId: 'demo-agent-4', name: 'Petra Voss',    email: 'petra@sparkdesk.demo', role: 'agent' as const },
    { workosUserId: 'demo-agent-5', name: 'Marcus Liu',    email: 'marcus@sparkdesk.demo',role: 'admin' as const },
    { workosUserId: 'demo-agent-6', name: 'Isla Grant',    email: 'isla@sparkdesk.demo',  role: 'agent' as const },
    { workosUserId: 'demo-agent-7', name: 'Dario Campos',  email: 'dario@sparkdesk.demo', role: 'agent' as const },
  ]
  const otherAgents = await Promise.all(
    agentDefs.map((a) =>
      db.agent.upsert({
        where: { workosUserId: a.workosUserId },
        create: { ...a, organizationId: org.id },
        update: {},
      })
    )
  )
  const agents = [jamie, ...otherAgents]

  // ── 26 customers across 17 companies ─────────────────────────────────────
  const customerDefs = [
    // Acme Corp (3)
    { email: 'sarah@acmecorp.com',        name: 'Sarah Chen',        company: 'Acme Corp' },
    { email: 'derek@acmecorp.com',         name: 'Derek Mills',       company: 'Acme Corp' },
    { email: 'jo@acmecorp.com',            name: 'Jo Wilder',         company: 'Acme Corp' },
    // GlobalTech (2)
    { email: 'marcus@globaltech.io',      name: 'Marcus Webb',       company: 'GlobalTech' },
    { email: 'yuna@globaltech.io',         name: 'Yuna Park',         company: 'GlobalTech' },
    // Northstar (1)
    { email: 'priya@northstar.co',        name: 'Priya Patel',       company: 'Northstar' },
    // Vertex Systems (2)
    { email: 'james@vertexsys.com',       name: "James O'Brien",     company: 'Vertex Systems' },
    { email: 'cleo@vertexsys.com',         name: 'Cleo Hartman',      company: 'Vertex Systems' },
    // Cloudify (1)
    { email: 'lin@cloudify.io',           name: 'Lin Nakamura',      company: 'Cloudify' },
    // PeakOps (2)
    { email: 'alex@peakops.com',          name: 'Alex Rivera',       company: 'PeakOps' },
    { email: 'finn@peakops.com',           name: 'Finn Larsen',       company: 'PeakOps' },
    // Meridian Labs (1)
    { email: 'dana@meridian.ai',          name: 'Dana Whitfield',    company: 'Meridian Labs' },
    // Cascade Co (2)
    { email: 'tom@cascadeco.com',         name: 'Tom Brewer',        company: 'Cascade Co' },
    { email: 'bex@cascadeco.com',          name: 'Bex Nguyen',        company: 'Cascade Co' },
    // Bright Signal (1)
    { email: 'nadia@brightsignal.com',    name: 'Nadia Osei',        company: 'Bright Signal' },
    // Atlas Data (2)
    { email: 'camille@atlasdata.io',      name: 'Camille Voss',      company: 'Atlas Data' },
    { email: 'theo@atlasdata.io',          name: 'Theo Marsh',        company: 'Atlas Data' },
    // Revenant AI (1)
    { email: 'zara@revenant.ai',          name: 'Zara Hollis',       company: 'Revenant AI' },
    // Synapse Works (2)
    { email: 'lena@synapseworks.com',     name: 'Lena Brandt',       company: 'Synapse Works' },
    { email: 'noah@synapseworks.com',      name: 'Noah Sato',         company: 'Synapse Works' },
    // Harbor Commerce (1)
    { email: 'mike@harborcommerce.com',   name: 'Mike Deleon',       company: 'Harbor Commerce' },
    // Quorum Analytics (2)
    { email: 'simone@quorumai.com',       name: 'Simone Adeyemi',    company: 'Quorum Analytics' },
    { email: 'raj@quorumai.com',           name: 'Raj Iyer',          company: 'Quorum Analytics' },
    // Helios Health (2)
    { email: 'ava@helioshealth.com',      name: 'Ava Johansson',     company: 'Helios Health' },
    { email: 'omar@helioshealth.com',      name: 'Omar Bakr',         company: 'Helios Health' },
    // Mosaic Finance (1)
    { email: 'eliot@mosaicfinance.com',   name: 'Eliot Graves',      company: 'Mosaic Finance' },
    // Tandem SaaS (1)
    { email: 'iris@tandemsaas.io',        name: 'Iris Fontaine',     company: 'Tandem SaaS' },
  ]

  const customers = await Promise.all(
    customerDefs.map((c) =>
      db.customer.upsert({
        where: { organizationId_email: { organizationId: org.id, email: c.email } },
        create: { ...c, organizationId: org.id },
        update: {},
      })
    )
  )

  // ── Ticket factory ────────────────────────────────────────────────────────
  type Msg = { role: 'customer' | 'agent'; body: string }
  type TicketDef = {
    subject: string
    channel: 'web' | 'email' | 'api' | 'slack'
    priority: 'urgent' | 'high' | 'normal' | 'low'
    status: 'open' | 'in_progress' | 'waiting_on_customer' | 'resolved' | 'closed'
    thread: Msg[]
    note?: string
    assigned?: boolean
    daysAgo: number
    hoursAgoOverride?: number
  }

  const tickets: TicketDef[] = [
    // ── Urgent ────────────────────────────────────────────────────────────
    {
      subject: "SAML SSO login loop — whole team locked out",
      channel: 'web', priority: 'urgent', status: 'in_progress', daysAgo: 0, hoursAgoOverride: 2, assigned: true,
      thread: [
        { role: 'customer', body: "Our entire team is locked out. SSO redirects back to the login page endlessly after the IdP callback. Started ~2 hours ago with no changes on our end." },
        { role: 'agent',    body: "On it. Can you share your IdP metadata URL? Also pulling the SAML processor logs now." },
      ],
      note: "Likely ACS URL mismatch after yesterday's cert rotation. Investigating with engineering.",
    },
    {
      subject: "Production API returning 503 intermittently",
      channel: 'api', priority: 'urgent', status: 'open', daysAgo: 0, hoursAgoOverride: 1,
      thread: [
        { role: 'customer', body: "Getting intermittent 503s from the API — about 1 in 20 requests. Started ~45 minutes ago. Our customer-facing product is degraded." },
      ],
    },
    {
      subject: "Two-factor auth locked out — sole admin",
      channel: 'email', priority: 'urgent', status: 'resolved', daysAgo: 5, assigned: true,
      thread: [
        { role: 'customer', body: "Lost access to my authenticator app and recovery codes. I'm the sole admin — the whole team is blocked." },
        { role: 'agent',    body: "Initiated identity verification. Please reply to the email sent to your account address with a photo ID — we'll restore access within 2 hours." },
        { role: 'customer', body: "Sent. Thank you for moving fast on this." },
        { role: 'agent',    body: "Verified and access restored. Strongly recommend adding a backup admin going forward." },
        { role: 'customer', body: "Already added two more. Really appreciate how you handled this." },
      ],
    },
    {
      subject: "API key unauthorized after rotation",
      channel: 'api', priority: 'urgent', status: 'resolved', daysAgo: 6, assigned: true,
      thread: [
        { role: 'customer', body: "Rotated our API key and now all requests return 401 Unauthorized — even after updating it everywhere in our stack." },
        { role: 'agent',    body: "There's a 15-minute auth cache layer. Your new key is valid — should be working now. Can you confirm?" },
        { role: 'customer', body: "It's working! Would've been great to know about the cache. Can you add that to the docs?" },
        { role: 'agent',    body: "Totally fair — flagged to our docs team. Adding a note to the API key rotation page." },
      ],
    },
    {
      subject: "Ticket auto-close firing after 2 days instead of 7",
      channel: 'web', priority: 'urgent', status: 'open', daysAgo: 0, hoursAgoOverride: 3,
      thread: [
        { role: 'customer', body: "We set auto-close to 7 days of inactivity but tickets are closing after 2–3 days. Customers are getting confused by the premature closure emails." },
      ],
    },
    // ── High ─────────────────────────────────────────────────────────────
    {
      subject: "Can't export billing data — CSV times out",
      channel: 'web', priority: 'high', status: 'in_progress', daysAgo: 3, assigned: true,
      thread: [
        { role: 'customer', body: "Trying to pull Q2 invoices but the CSV export times out after ~30s. We have ~800 invoices. Is there a row limit?" },
        { role: 'agent',    body: "You've hit a known issue with large date range exports. Workaround: export in 30-day chunks. Fix ships this week." },
        { role: 'customer', body: "Chunked export worked — thank you! Looking forward to the fix." },
      ],
      note: "Query timeout on large ranges. Fix in staging, ETA this week.",
    },
    {
      subject: "Slack integration not syncing agent replies",
      channel: 'slack', priority: 'high', status: 'open', daysAgo: 0, hoursAgoOverride: 9,
      thread: [
        { role: 'customer', body: "Agent replies from SparkDesk aren't appearing in our #support Slack channel. New ticket messages come through fine, just not replies." },
      ],
    },
    {
      subject: "Webhook payload missing custom fields",
      channel: 'api', priority: 'high', status: 'in_progress', daysAgo: 3, assigned: true,
      thread: [
        { role: 'customer', body: "Our ticket.created webhook payloads are missing the custom_fields object. The API schema docs say it should be present." },
        { role: 'agent',    body: "Confirmed — custom fields are excluded from webhook payloads in the current version. Known gap, fix targeted for next release. I'll notify you directly." },
      ],
      note: "Engineering confirmed: v2 payload schema gap. Filed CORE-441, targeted for 2.4.",
    },
    {
      subject: "Mobile app crashes opening long threads",
      channel: 'web', priority: 'high', status: 'in_progress', daysAgo: 2, assigned: true,
      thread: [
        { role: 'customer', body: "iOS app crashes immediately when opening any ticket with more than ~10 messages. iPhone 15, iOS 17.4. Short threads are fine." },
        { role: 'agent',    body: "Reproduced — memory issue with long threads. Fix is in the next app release this week. Web app working as a workaround?" },
        { role: 'customer', body: "Yes, web is fine for now. Thanks for the quick response." },
      ],
    },
    {
      subject: "Admin can't see tickets assigned to other agents",
      channel: 'web', priority: 'high', status: 'in_progress', daysAgo: 1, assigned: true,
      thread: [
        { role: 'customer', body: "Our admin user can only see their own assigned tickets despite having the admin role. Regular agents see everything. Started after the last update." },
        { role: 'agent',    body: "Reproduced — regression in 2.3.1. Hotfix deploying now, ETA 1 hour." },
      ],
      note: "Role filter regression from 2.3.1. Hotfix CORE-512 in progress.",
    },
    {
      subject: "Zapier integration returning 403",
      channel: 'api', priority: 'high', status: 'open', daysAgo: 1,
      thread: [
        { role: 'customer', body: "Our Zapier zap stopped working yesterday — getting 403 when it tries to create tickets. The API key has the right permissions." },
      ],
    },
    {
      subject: "Notification emails delayed 30+ minutes",
      channel: 'email', priority: 'high', status: 'resolved', daysAgo: 9, assigned: true,
      thread: [
        { role: 'customer', body: "Ticket assignment emails are arriving 30–45 minutes late. Makes our SLA response targets basically impossible to hit." },
        { role: 'agent',    body: "Email delivery queue had a backlog yesterday evening — cleared now. Added queue depth monitoring so this won't recur silently." },
        { role: 'customer', body: "Confirmed, emails are immediate again. Thank you." },
      ],
    },
    {
      subject: "Customer not receiving our reply emails",
      channel: 'email', priority: 'high', status: 'resolved', daysAgo: 8, assigned: true,
      thread: [
        { role: 'customer', body: "We've replied to several tickets and the customer keeps saying they're not getting our responses. We can see them sent in the thread." },
        { role: 'agent',    body: "Delivery logs show their domain has strict filtering blocking our sending domain. Sent SPF/DKIM instructions to their IT team. BCC workaround for now." },
        { role: 'customer', body: "Their IT updated the allowlist and it's working now. Thank you." },
      ],
    },
    {
      subject: "SSO not provisioning new users automatically",
      channel: 'web', priority: 'high', status: 'waiting_on_customer', daysAgo: 6, assigned: true,
      thread: [
        { role: 'customer', body: "JIT provisioning is enabled but new employees who log in via SSO get an access denied screen instead of being auto-provisioned." },
        { role: 'agent',    body: "JIT provisioning requires your email domain to be verified. Can you confirm your domain is listed under Settings > SSO > Verified Domains?" },
      ],
    },
    {
      subject: "Priority not updating via API PATCH",
      channel: 'api', priority: 'high', status: 'open', daysAgo: 0, hoursAgoOverride: 5,
      thread: [
        { role: 'customer', body: "PATCH /tickets/:id with {priority: 'urgent'} returns 200 but the priority doesn't change. Status updates work fine through the same endpoint." },
      ],
    },
    {
      subject: "Dashboard extremely slow — 20 second load",
      channel: 'web', priority: 'high', status: 'resolved', daysAgo: 11, assigned: true,
      thread: [
        { role: 'customer', body: "Main dashboard takes 15–20 seconds to load. We have ~500 open tickets — is there a pagination issue?" },
        { role: 'agent',    body: "Found a missing index on the tickets table causing full scans. Deployed a fix this morning — can you confirm load times are normal?" },
        { role: 'customer', body: "Under 2 seconds now. Great work!" },
      ],
    },
    {
      subject: "PagerDuty alerts not firing for urgent tickets",
      channel: 'api', priority: 'high', status: 'waiting_on_customer', daysAgo: 7, assigned: true,
      thread: [
        { role: 'customer', body: "PagerDuty isn't alerting when urgent tickets come in. Non-urgent tickets work fine." },
        { role: 'agent',    body: "The PD trigger rule has a priority filter — can you check Integrations > PagerDuty and confirm 'urgent' is checked?" },
      ],
    },
    {
      subject: "Reports page 504 on 90-day date range",
      channel: 'web', priority: 'high', status: 'open', daysAgo: 0, hoursAgoOverride: 6,
      thread: [
        { role: 'customer', body: "Reports page 504s when I run a 90-day report. 30-day works fine. Need the quarterly view for our board deck next week." },
      ],
    },
    // ── Normal ────────────────────────────────────────────────────────────
    {
      subject: "How do I add a second workspace?",
      channel: 'web', priority: 'normal', status: 'waiting_on_customer', daysAgo: 5, assigned: true,
      thread: [
        { role: 'customer', body: "We're expanding to a new region and need a separate support workspace. Is that possible on Pro?" },
        { role: 'agent',    body: "Yes — multiple workspaces are available on Pro. Do you need a completely separate org or just a separate inbox view?" },
      ],
    },
    {
      subject: "API rate limit questions",
      channel: 'api', priority: 'normal', status: 'resolved', daysAgo: 10, assigned: true,
      thread: [
        { role: 'customer', body: "What are the rate limits on the v1 API for the Pro plan?" },
        { role: 'agent',    body: "Pro plan is 1,000 req/min per org. Let me know if you need higher — we can discuss custom arrangements." },
        { role: 'customer', body: "Perfect, that's plenty. Thanks!" },
      ],
    },
    {
      subject: "Custom SLA configuration per priority",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 1,
      thread: [
        { role: 'customer', body: "Is it possible to set different SLA windows per priority? We want urgent = 1hr, high = 4hr, normal = 24hr." },
      ],
    },
    {
      subject: "How to migrate from Zendesk?",
      channel: 'email', priority: 'normal', status: 'resolved', daysAgo: 20, assigned: true,
      thread: [
        { role: 'customer', body: "We're migrating from Zendesk. Do you have an import tool for existing tickets and customer data?" },
        { role: 'agent',    body: "Yes — Settings > Import > Zendesk. Export your Zendesk data first (CSV). The importer handles tickets, customers, and tags. Attachments require Professional." },
        { role: 'customer', body: "Excellent, we're on Professional. Starting the import now." },
      ],
    },
    {
      subject: "Email-to-ticket not parsing attachments",
      channel: 'email', priority: 'normal', status: 'in_progress', daysAgo: 5, assigned: true,
      thread: [
        { role: 'customer', body: "When customers send emails with PDF attachments, the ticket is created but attachments are missing. Email body is fine." },
        { role: 'agent',    body: "Attachments over 5MB are currently stripped — known limitation. Are your PDFs larger?" },
        { role: 'customer', body: "Yes, 8–12MB. Is there a workaround?" },
        { role: 'agent',    body: "Ask customers to share a link for now. We're raising the limit to 25MB in Q3 — I'll flag you when it ships." },
      ],
    },
    {
      subject: "Salesforce contact sync failing",
      channel: 'api', priority: 'normal', status: 'resolved', daysAgo: 14,
      thread: [
        { role: 'customer', body: "The Salesforce integration synced contacts last week but now shows 'last sync failed' with no error details." },
        { role: 'agent',    body: "Expired Salesforce OAuth token — go to Integrations > Salesforce > Reconnect to refresh it." },
        { role: 'customer', body: "Reconnected and syncing again. Thank you." },
      ],
    },
    {
      subject: "GitHub integration not creating tickets from issues",
      channel: 'api', priority: 'normal', status: 'open', daysAgo: 2,
      thread: [
        { role: 'customer', body: "Set up the GitHub integration to auto-create tickets from issues labeled 'support' but nothing is coming through. Webhook shows active in GitHub." },
      ],
    },
    {
      subject: "Bulk close action hangs indefinitely",
      channel: 'web', priority: 'normal', status: 'in_progress', daysAgo: 4, assigned: true,
      thread: [
        { role: 'customer', body: "Trying to bulk-close 200+ resolved tickets. The spinner runs forever and tickets aren't actually closed." },
        { role: 'agent',    body: "There's a 50-ticket concurrency limit on bulk operations. Working on a queue-based system — try 50 at a time as a workaround." },
        { role: 'customer', body: "Works but painful for our weekly cleanup. Flagging as blocking." },
      ],
      note: "Customer has 1,200 resolved tickets to close. Needs async queue. Filed CORE-441.",
    },
    {
      subject: "Audit log showing wrong actor for bulk actions",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 2,
      thread: [
        { role: 'customer', body: "Audit log shows 'System' as actor for bulk closes performed by a specific agent. Causing compliance issues in our SOC 2 audit." },
      ],
    },
    {
      subject: "Tags not appearing in reports",
      channel: 'web', priority: 'normal', status: 'resolved', daysAgo: 13,
      thread: [
        { role: 'customer', body: "We tag all tickets by product area but the Reports page has no tag breakdown. Is there a filter I'm missing?" },
        { role: 'agent',    body: "Tag-based reporting is on the roadmap for Q3. Right now you can export as CSV and pivot by the tags column in Sheets." },
        { role: 'customer', body: "CSV works for now. Thanks for the workaround." },
      ],
    },
    {
      subject: "Inline images not showing in ticket thread",
      channel: 'email', priority: 'normal', status: 'resolved', daysAgo: 11,
      thread: [
        { role: 'customer', body: "When customers send emails with inline screenshots, images show as broken in the thread. Attached images work fine." },
        { role: 'agent',    body: "Inline images are converted to attachments in the current version. Native inline rendering ships in 2.4 — added you to the beta notification list." },
        { role: 'customer', body: "Good to know. Working around it for now." },
      ],
    },
    {
      subject: "Need consolidated billing across workspaces",
      channel: 'email', priority: 'normal', status: 'waiting_on_customer', daysAgo: 4, assigned: true,
      thread: [
        { role: 'customer', body: "We have 3 workspaces billed separately. Finance needs a single consolidated invoice." },
        { role: 'agent',    body: "Yes — can you confirm the primary billing email and company name to link all three workspaces?" },
      ],
    },
    {
      subject: "Does SparkDesk support multiple inboxes?",
      channel: 'email', priority: 'normal', status: 'resolved', daysAgo: 14,
      thread: [
        { role: 'customer', body: "We have support@, sales@, and billing@ addresses. Can each map to a separate inbox in SparkDesk?" },
        { role: 'agent',    body: "Yes — configure each address as a separate channel in Settings > Channels. They appear as separate inbox views in the sidebar." },
        { role: 'customer', body: "Setting it up now. Thanks!" },
      ],
    },
    {
      subject: "Two agents replied to same ticket simultaneously",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 0, hoursAgoOverride: 4,
      thread: [
        { role: 'customer', body: "Two of our agents both sent replies to the same ticket at the same time — customer got two contradictory answers. Is there collision detection?" },
      ],
    },
    {
      subject: "Reply template variables not rendering",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 0, hoursAgoOverride: 7,
      thread: [
        { role: 'customer', body: "Using {{customer_name}} in a canned response but it appears literally in the sent email instead of being replaced." },
      ],
    },
    {
      subject: "Auto-assign tickets by keyword",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 1,
      thread: [
        { role: 'customer', body: "Is there a way to auto-assign tickets containing certain keywords to specific agents? e.g. 'billing' goes to our finance person." },
      ],
    },
    {
      subject: "Search not returning results for resolved tickets",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 0, hoursAgoOverride: 14,
      thread: [
        { role: 'customer', body: "Searching for a keyword I know appears in a resolved ticket returns no results. Works fine for open tickets. Am I missing a filter?" },
      ],
    },
    {
      subject: "How to set business hours for SLA",
      channel: 'web', priority: 'normal', status: 'resolved', daysAgo: 19,
      thread: [
        { role: 'customer', body: "Where do I configure business hours so the SLA clock pauses outside of 9–5 Mon–Fri?" },
        { role: 'agent',    body: "Settings > SLA > Business Hours. Set timezone, working days, and hours — clock pauses automatically." },
        { role: 'customer', body: "Found it, works perfectly!" },
      ],
    },
    {
      subject: "Ticket merge feature request",
      channel: 'web', priority: 'normal', status: 'closed', daysAgo: 22,
      thread: [
        { role: 'customer', body: "We often get the same issue from multiple people. A merge feature would let us track related tickets together. Any plans?" },
        { role: 'agent',    body: "It's on our backlog — added your upvote. For now you can reference ticket IDs in internal notes to link them." },
        { role: 'customer', body: "Good enough for now. Thanks." },
      ],
    },
    {
      subject: "Email templates per channel — feature request",
      channel: 'email', priority: 'normal', status: 'closed', daysAgo: 25,
      thread: [
        { role: 'customer', body: "We handle tickets for two products — is it possible to have different email reply templates per channel?" },
        { role: 'agent',    body: "Not yet — on the roadmap for Q4. Workaround: use tagged canned responses per product." },
        { role: 'customer', body: "It could work. Please keep me posted." },
      ],
    },
    {
      subject: "Getting started — need onboarding help",
      channel: 'web', priority: 'normal', status: 'resolved', daysAgo: 28, assigned: true,
      thread: [
        { role: 'customer', body: "Just signed up. We have 4 support agents and ~200 tickets/month. Where should I start?" },
        { role: 'agent',    body: "Welcome! Suggested order: 1) Add your team in Settings > Team, 2) Connect your support email in Settings > Channels, 3) Import existing tickets via the CSV importer." },
        { role: 'customer', body: "The walkthrough was super helpful. We're live and handling tickets already." },
      ],
    },
    {
      subject: "Webhook not firing on ticket.closed event",
      channel: 'api', priority: 'normal', status: 'open', daysAgo: 0, hoursAgoOverride: 4,
      thread: [
        { role: 'customer', body: "Our webhook endpoint is configured but we're not receiving ticket.closed events. We see ticket.created and ticket.updated fine." },
      ],
    },
    {
      subject: "SMTP relay configuration for outbound email",
      channel: 'email', priority: 'normal', status: 'resolved', daysAgo: 17, assigned: true,
      thread: [
        { role: 'customer', body: "We need outbound ticket emails to come from our own domain (support@ourcompany.com) rather than the SparkDesk default. How do we configure that?" },
        { role: 'agent',    body: "Settings > Channels > Email > Custom SMTP. You'll need your SMTP host, port, and credentials. We'll send a verification email to confirm." },
        { role: 'customer', body: "Configured and verified. Looking great — emails are coming from our domain now." },
      ],
    },
    {
      subject: "How do I reopen a resolved ticket?",
      channel: 'web', priority: 'normal', status: 'resolved', daysAgo: 9,
      thread: [
        { role: 'customer', body: "A customer replied to a resolved ticket and it auto-reopened. But I have another resolved ticket I want to manually reopen — I can't find the option." },
        { role: 'agent',    body: "Click the status badge in the ticket header and select 'Open' from the dropdown. The ticket will move back to the inbox." },
        { role: 'customer', body: "Found it! Hidden in plain sight." },
      ],
    },
    {
      subject: "Can I set working hours per agent?",
      channel: 'web', priority: 'normal', status: 'open', daysAgo: 2,
      thread: [
        { role: 'customer', body: "We have agents across three time zones. Is it possible to set individual working hours per agent so tickets auto-assign based on who's online?" },
      ],
    },
    {
      subject: "Ticket count badge not updating in real time",
      channel: 'web', priority: 'normal', status: 'resolved', daysAgo: 6,
      thread: [
        { role: 'customer', body: "The open ticket count in the sidebar doesn't update until I refresh the page. We're expecting real-time updates since we discussed that in the sales call." },
        { role: 'agent',    body: "Real-time updates require WebSocket — currently only available on the Enterprise plan. On Pro, the count updates every 60 seconds or on manual refresh. Apologies if this wasn't clear during the sales process." },
        { role: 'customer', body: "That's frustrating given what we were told, but I understand. Flagging for our renewal conversation." },
      ],
    },
    {
      subject: "Intercom migration — import conversations",
      channel: 'email', priority: 'normal', status: 'resolved', daysAgo: 23, assigned: true,
      thread: [
        { role: 'customer', body: "We're leaving Intercom. Can we import our full conversation history including customer messages?" },
        { role: 'agent',    body: "The CSV importer supports full conversation threads. Export from Intercom as CSV, then Settings > Import > CSV. Here's the column mapping guide: [link]." },
        { role: 'customer', body: "Import completed successfully. Took about 20 minutes for 3,000 conversations." },
      ],
    },
    // ── Low ───────────────────────────────────────────────────────────────
    {
      subject: "Invoice showing old company name",
      channel: 'email', priority: 'low', status: 'resolved', daysAgo: 7, assigned: true,
      thread: [
        { role: 'customer', body: "Our invoices still show 'Meridian Inc' — we rebranded to 'Meridian Labs' last month. Can you re-issue the last two invoices?" },
        { role: 'agent',    body: "Updated the billing name and re-issued invoices for May and June. You should receive them within minutes." },
        { role: 'customer', body: "Got them, thank you!" },
      ],
    },
    {
      subject: "Promo code not applying at checkout",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 8,
      thread: [
        { role: 'customer', body: "Code SPARK30 is showing 'invalid' at the upgrade screen." },
        { role: 'agent',    body: "SPARK30 expired end of May — generated a new 30% code and DM'd it to your account email. Valid for 7 days." },
        { role: 'customer', body: "Applied it, thank you!" },
      ],
    },
    {
      subject: "Need VAT number on all invoices",
      channel: 'email', priority: 'low', status: 'resolved', daysAgo: 15, assigned: true,
      thread: [
        { role: 'customer', body: "We're EU-based and need our VAT number (DE123456789) added to all invoices for tax compliance." },
        { role: 'agent',    body: "Added to your billing profile — future invoices will include it automatically. Also updated the last 3 invoices." },
        { role: 'customer', body: "Perfect, exactly what we needed." },
      ],
    },
    {
      subject: "How to downgrade to free plan?",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 18,
      thread: [
        { role: 'customer', body: "We're pausing operations for a couple months. How do I switch to the free plan without losing data?" },
        { role: 'agent',    body: "Settings > Billing > Change Plan. Data is retained for 90 days — when you upgrade again, everything will be exactly as you left it." },
        { role: 'customer', body: "Done. Thanks for the reassurance about data retention." },
      ],
    },
    {
      subject: "Cancel a seat for departed employee",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 9,
      thread: [
        { role: 'customer', body: "One of our agents left. How do I remove their seat and stop being billed for it?" },
        { role: 'agent',    body: "Team > select agent > Remove from workspace. Seat released immediately, next invoice will be prorated." },
        { role: 'customer', body: "Done, thanks!" },
      ],
    },
    {
      subject: "Can I set a custom ticket ID prefix?",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 20,
      thread: [
        { role: 'customer', body: "We use ticket IDs in customer communications. Can I set a prefix like 'PEAK-'?" },
        { role: 'agent',    body: "Not currently — added your vote to the feature request. Workaround: add ticket number manually to the subject line." },
        { role: 'customer', body: "Understood, thanks for logging it." },
      ],
    },
    {
      subject: "How do canned responses work?",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 16,
      thread: [
        { role: 'customer', body: "Saw 'canned responses' in the changelog but can't find where to set them up." },
        { role: 'agent',    body: "Settings > Canned Responses > New Response. Use {{customer_name}} and {{ticket_id}} as variables. Type / in any reply box to search." },
        { role: 'customer', body: "Found it — this is going to save us a ton of time." },
      ],
    },
    {
      subject: "Can agents see each other's internal notes?",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 17,
      thread: [
        { role: 'customer', body: "Are internal notes visible to all agents or just the author?" },
        { role: 'agent',    body: "All agents in your workspace can see internal notes — for team coordination. Never visible to customers." },
        { role: 'customer', body: "Perfect, that's what we needed." },
      ],
    },
    {
      subject: "Duplicate charge in June",
      channel: 'email', priority: 'low', status: 'resolved', daysAgo: 12, assigned: true,
      thread: [
        { role: 'customer', body: "I was charged twice on June 1st — both $149. Please refund the duplicate." },
        { role: 'agent',    body: "Confirmed billing error on our side. Issued a full refund — should appear in 3–5 business days." },
        { role: 'customer', body: "Received. Thank you for the fast turnaround." },
      ],
    },
    {
      subject: "Agent status not showing as online",
      channel: 'web', priority: 'low', status: 'resolved', daysAgo: 16,
      thread: [
        { role: 'customer', body: "My status shows offline to my team even though I'm actively in SparkDesk." },
        { role: 'agent',    body: "Presence relies on WebSocket — a browser extension is likely blocking it. Try incognito to test." },
        { role: 'customer', body: "Incognito works — it was a privacy extension. Whitelisted the domain, all good now." },
      ],
    },
    {
      subject: "Ticket subject truncated in email notifications",
      channel: 'email', priority: 'low', status: 'open', daysAgo: 0, hoursAgoOverride: 11,
      thread: [
        { role: 'customer', body: "Long ticket subjects are cut off at ~60 characters in email notifications. The full subject shows in the UI fine." },
      ],
    },
    {
      subject: "Keyboard shortcut conflicts with browser",
      channel: 'web', priority: 'low', status: 'open', daysAgo: 0, hoursAgoOverride: 8,
      thread: [
        { role: 'customer', body: "The Cmd+K global search shortcut conflicts with my browser's address bar. Is there a way to rebind it?" },
      ],
    },
    {
      subject: "Can I export the customer list?",
      channel: 'web', priority: 'low', status: 'open', daysAgo: 0, hoursAgoOverride: 13,
      thread: [
        { role: 'customer', body: "I need to export all customer records (name, email, company, ticket count) as a CSV. Is there an export option in the Customers page?" },
      ],
    },
    {
      subject: "New ticket form not saving draft",
      channel: 'web', priority: 'low', status: 'open', daysAgo: 0, hoursAgoOverride: 16,
      thread: [
        { role: 'customer', body: "If I start a new ticket and navigate away, the draft is gone when I return. Chrome on macOS. Does it work in other browsers?" },
      ],
    },
    {
      subject: "Dark mode for the customer portal?",
      channel: 'web', priority: 'low', status: 'closed', daysAgo: 30,
      thread: [
        { role: 'customer', body: "Does the customer-facing ticket portal support dark mode? Our app is dark-mode-first and the bright portal feels jarring." },
        { role: 'agent',    body: "Not currently — the portal only has a light theme. Dark mode portal is on our roadmap. Added your vote." },
        { role: 'customer', body: "Thanks for noting it. Not a blocker for us." },
      ],
    },
    {
      subject: "Notification sound setting",
      channel: 'web', priority: 'low', status: 'closed', daysAgo: 27,
      thread: [
        { role: 'customer', body: "Is there a way to enable a sound notification for new tickets? Our agents miss tickets when they're not watching the screen." },
        { role: 'agent',    body: "Browser notifications are available — Settings > Notifications > Enable Browser Alerts. Sound support is on the roadmap." },
        { role: 'customer', body: "Browser notifications will work for now. Thanks." },
      ],
    },
  ]

  for (const t of tickets) {
    const customer = pick(customers)
    const assignee = t.assigned ? pick(agents) : null
    const createdAt = t.daysAgo === 0
      ? hoursAgo(t.hoursAgoOverride ?? Math.floor(Math.random() * 8) + 1)
      : daysAgo(t.daysAgo)

    await db.ticket.create({
      data: {
        subject: t.subject,
        status: t.status,
        priority: t.priority,
        channel: t.channel,
        organizationId: org.id,
        customerId: customer.id,
        assigneeId: assignee?.id ?? null,
        createdAt,
        updatedAt: t.thread.length > 1
          ? new Date(createdAt.getTime() + (t.thread.length - 1) * 3_600_000)
          : createdAt,
        messages: {
          create: t.thread.map((m, i) => ({
            body: m.body,
            authorType: m.role,
            agentId: m.role === 'agent' ? (assignee ?? pick(agents)).id : null,
            createdAt: new Date(createdAt.getTime() + i * 3_600_000),
          })),
        },
        ...(t.note ? {
          notes: { create: { body: t.note, agentId: (assignee ?? jamie).id, createdAt } },
        } : {}),
      },
    })
  }

  console.log(`\nSeeded: ${tickets.length} tickets, ${customerDefs.length} customers across 17 companies, ${agents.length} agents`)
  console.log(`DEMO_ORG_ID=${org.id}`)
  console.log(`DEMO_AGENT_ID=${jamie.id}`)
}

main().catch(console.error).finally(() => db.$disconnect())
