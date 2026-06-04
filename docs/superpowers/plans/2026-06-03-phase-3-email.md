# Phase 3: Email Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/email` with 6 React Email templates sent via Resend, then wire send calls into `apps/api` route handlers — demonstrating the "email templates defined in code but invisible to product and marketing" use case Voltage surfaces.

**Architecture:** A single `@sparkdesk/email` package owns all templates and the Resend client wrapper. Templates are React components with typed props. The send function accepts a rendered React element and no-ops when `RESEND_API_KEY` is absent. Trigger calls live in `apps/api` route handlers — the package just renders and delivers.

**Tech Stack:** `@react-email/components` 1.x, `resend` 6.x, React 19, vitest 2.x

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/email/package.json` | Create | Package manifest, resend + react-email deps |
| `packages/email/tsconfig.json` | Create | TypeScript config (JSX react-jsx) |
| `packages/email/vite.config.ts` | Create | Vitest config with React plugin for JSX in tests |
| `packages/email/src/sender.ts` | Create | Resend client wrapper — `sendEmail()`, no-op when key absent |
| `packages/email/src/sender.test.ts` | Create | Tests: no-op behavior, sends when key present (mocked) |
| `packages/email/src/templates/ticket-created.tsx` | Create | Customer confirmation on ticket open |
| `packages/email/src/templates/ticket-replied.tsx` | Create | Customer notification on agent reply |
| `packages/email/src/templates/ticket-resolved.tsx` | Create | Customer resolution confirmation |
| `packages/email/src/templates/agent-assigned.tsx` | Create | Agent notification on ticket assignment |
| `packages/email/src/templates/sla-breach-warning.tsx` | Create | Agent alert when SLA approaching |
| `packages/email/src/templates/weekly-digest.tsx` | Create | Admin weekly summary |
| `packages/email/src/index.ts` | Create | Re-exports all templates + sendEmail |
| `apps/api/package.json` | Modify | Add `@sparkdesk/email: workspace:*` |
| `apps/api/src/routes/tickets.ts` | Modify | Call sendEmail on ticket_created, ticket_replied, ticket_resolved, agent_assigned |
| `apps/api/.env.example` | Modify | Add RESEND_API_KEY, EMAIL_FROM |

---

### Task 1: `packages/email` scaffold — sender + tests

**Files:**
- Create: `packages/email/package.json`
- Create: `packages/email/tsconfig.json`
- Create: `packages/email/vite.config.ts`
- Create: `packages/email/src/sender.ts`
- Create: `packages/email/src/sender.test.ts`

- [ ] **Step 1: Create `packages/email/package.json`**

```json
{
  "name": "@sparkdesk/email",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run"
  },
  "dependencies": {
    "@react-email/components": "^1.0.0",
    "resend": "^6.0.0"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.5.0",
    "vite": "^5.0.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/email/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/email/vite.config.ts`**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 4: Install dependencies**

```bash
pnpm --filter @sparkdesk/email install
```

Expected: `resend`, `@react-email/components`, `@vitejs/plugin-react` installed.

- [ ] **Step 5: Write the failing tests first**

Create `packages/email/src/sender.test.ts`:

```typescript
import * as React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('sendEmail', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.RESEND_API_KEY
  })

  it('resolves without error when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY
    const { sendEmail } = await import('./sender')
    const el = React.createElement('div', null, 'test')
    await expect(
      sendEmail({ to: 'test@example.com', subject: 'Test', react: el })
    ).resolves.toBeUndefined()
  })

  it('calls resend.emails.send when RESEND_API_KEY is set', async () => {
    process.env.RESEND_API_KEY = 're_test_key'
    const mockSend = vi.fn().mockResolvedValue({ data: { id: 'msg_123' }, error: null })
    vi.doMock('resend', () => ({
      Resend: vi.fn().mockImplementation(() => ({ emails: { send: mockSend } })),
    }))
    const { sendEmail } = await import('./sender')
    const el = React.createElement('div', null, 'test')
    await sendEmail({ to: 'agent@sparkdesk.io', subject: 'You have been assigned', react: el })
    expect(mockSend).toHaveBeenCalledOnce()
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'agent@sparkdesk.io', subject: 'You have been assigned' })
    )
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
pnpm --filter @sparkdesk/email test
```

Expected: FAIL — `Cannot find module './sender'`

- [ ] **Step 7: Create `packages/email/src/sender.ts`**

```typescript
import { Resend } from 'resend'
import * as React from 'react'

let _client: Resend | null = null

/**
 * Returns the Resend client.
 * Returns null (safe no-op) when RESEND_API_KEY is not set —
 * so local development works without a Resend account.
 */
function getResendClient(): Resend | null {
  if (_client) return _client
  if (!process.env.RESEND_API_KEY) return null
  _client = new Resend(process.env.RESEND_API_KEY)
  return _client
}

export interface SendEmailOptions {
  /** Recipient email address */
  to: string
  subject: string
  /** React Email template element — Resend renders it to HTML internally */
  react: React.ReactElement
}

/**
 * Send a transactional email via Resend.
 * No-ops when RESEND_API_KEY is not set.
 */
export async function sendEmail({ to, subject, react }: SendEmailOptions): Promise<void> {
  const client = getResendClient()
  if (!client) return

  await client.emails.send({
    from: process.env.EMAIL_FROM ?? 'SparkDesk <noreply@sparkdesk.io>',
    to,
    subject,
    react,
  })
}
```

- [ ] **Step 8: Run tests — expect them to pass**

```bash
pnpm --filter @sparkdesk/email test
```

Expected: PASS — 2 tests pass.

- [ ] **Step 9: Typecheck**

```bash
pnpm --filter @sparkdesk/email typecheck
```

Expected: no errors. (Note: `src/index.ts` doesn't exist yet — add an empty placeholder so tsc doesn't error on missing entry point.)

Create `packages/email/src/index.ts` with just a comment for now:
```typescript
// Exports added in Task 2
```

- [ ] **Step 10: Commit**

```bash
git add packages/email/
git commit -m "feat(email): scaffold @sparkdesk/email package with Resend sender"
```

---

### Task 2: All 6 email templates + index.ts

**Files:**
- Create: `packages/email/src/templates/ticket-created.tsx`
- Create: `packages/email/src/templates/ticket-replied.tsx`
- Create: `packages/email/src/templates/ticket-resolved.tsx`
- Create: `packages/email/src/templates/agent-assigned.tsx`
- Create: `packages/email/src/templates/sla-breach-warning.tsx`
- Create: `packages/email/src/templates/weekly-digest.tsx`
- Modify: `packages/email/src/index.ts`

All templates use the same design system — SparkDesk dark header, indigo accent (#818CF8), clean white content area. All styles are inline objects (required for email client compatibility). Copy the shared style constants into each file independently — they must be self-contained.

- [ ] **Step 1: Create `packages/email/src/templates/ticket-created.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface TicketCreatedEmailProps {
  /** Customer's display name */
  customerName: string
  /** Subject line of the ticket */
  ticketSubject: string
  /** Ticket database ID */
  ticketId: string
  /** URL where customer can view their ticket */
  supportUrl: string
}

/**
 * Sent to the customer when a new support ticket is opened.
 * Confirms receipt and provides a direct link to the ticket.
 */
export function TicketCreatedEmail({
  customerName,
  ticketSubject,
  ticketId,
  supportUrl,
}: TicketCreatedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your support ticket has been received — {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>We&apos;ve got your request</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              Your support ticket has been received and a member of our team will be in touch shortly.
            </Text>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>TICKET</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>#{ticketId.slice(-8).toUpperCase()}</Text>
            </Section>
            <Button style={button} href={supportUrl}>
              View your ticket
            </Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You&apos;re receiving this because you submitted a support request. If you didn&apos;t, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#71717a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 2: Create `packages/email/src/templates/ticket-replied.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface TicketRepliedEmailProps {
  customerName: string
  ticketSubject: string
  ticketId: string
  /** Name of the agent who sent the reply */
  agentName: string
  /** The reply body text to show in the email */
  replyBody: string
  supportUrl: string
}

/**
 * Sent to the customer when an agent replies to their ticket.
 * Shows the reply inline so the customer can respond without opening the portal.
 */
export function TicketRepliedEmail({
  customerName, ticketSubject, ticketId, agentName, replyBody, supportUrl,
}: TicketRepliedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{agentName} replied to your ticket: {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>New reply on your ticket</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>{agentName} from our team has replied to your ticket.</Text>
            <Section style={replyBox}>
              <Text style={replyAgentName}>{agentName}</Text>
              <Text style={replyBodyStyle}>{replyBody}</Text>
            </Section>
            <Button style={button} href={supportUrl}>View full conversation</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Ticket #{ticketId.slice(-8).toUpperCase()} · {ticketSubject}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const replyBox: React.CSSProperties = { borderLeft: '3px solid #818CF8', paddingLeft: '16px', margin: '24px 0' }
const replyAgentName: React.CSSProperties = { fontSize: '13px', fontWeight: '600', color: '#818CF8', margin: '0 0 8px' }
const replyBodyStyle: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block', marginTop: '24px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 3: Create `packages/email/src/templates/ticket-resolved.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface TicketResolvedEmailProps {
  customerName: string
  ticketSubject: string
  ticketId: string
  agentName: string
  supportUrl: string
}

/**
 * Sent to the customer when their ticket is marked resolved.
 * Includes a link to reopen if the issue persists.
 */
export function TicketResolvedEmail({
  customerName, ticketSubject, ticketId, agentName, supportUrl,
}: TicketResolvedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your ticket has been resolved — {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Your ticket has been resolved</Heading>
            <Text style={text}>Hi {customerName},</Text>
            <Text style={text}>
              {agentName} has marked your support ticket as resolved. We hope we were able to help!
            </Text>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>RESOLVED</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>#{ticketId.slice(-8).toUpperCase()}</Text>
            </Section>
            <Text style={text}>If your issue isn&apos;t fully resolved, you can reopen the ticket at any time.</Text>
            <Button style={button} href={supportUrl}>View ticket</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because you submitted a support request to SparkDesk.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f0fdf4', borderRadius: '8px', padding: '16px 20px', margin: '24px 0', border: '1px solid #bbf7d0' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#16a34a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block', marginTop: '8px' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 4: Create `packages/email/src/templates/agent-assigned.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface AgentAssignedEmailProps {
  /** Name of the agent being assigned */
  agentName: string
  ticketSubject: string
  ticketId: string
  customerName: string
  /** Ticket priority level */
  priority: 'urgent' | 'high' | 'normal' | 'low'
  /** Link directly to the ticket in the dashboard */
  dashboardUrl: string
}

/**
 * Sent to an agent when a ticket is assigned to them.
 * Includes ticket context so they can respond without navigating first.
 */
export function AgentAssignedEmail({
  agentName, ticketSubject, ticketId, customerName, priority, dashboardUrl,
}: AgentAssignedEmailProps) {
  const priorityColor = priority === 'urgent' ? '#ef4444' : priority === 'high' ? '#f97316' : '#71717a'

  return (
    <Html>
      <Head />
      <Preview>Ticket assigned to you: {ticketSubject}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>You&apos;ve been assigned a ticket</Heading>
            <Text style={text}>Hi {agentName},</Text>
            <Text style={text}>A support ticket has been assigned to you and is waiting for your response.</Text>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>ASSIGNED TICKET</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>
                #{ticketId.slice(-8).toUpperCase()} · {customerName} ·{' '}
                <span style={{ color: priorityColor, fontWeight: '600' }}>
                  {priority.charAt(0).toUpperCase() + priority.slice(1)}
                </span>
              </Text>
            </Section>
            <Button style={button} href={dashboardUrl}>Open ticket</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because a ticket was assigned to your SparkDesk account.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px 20px', margin: '24px 0' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#71717a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 5: Create `packages/email/src/templates/sla-breach-warning.tsx`**

```tsx
import {
  Body, Button, Container, Head, Heading, Hr, Html,
  Preview, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface SlaBreachWarningEmailProps {
  agentName: string
  ticketSubject: string
  ticketId: string
  customerName: string
  /** ISO 8601 deadline string, e.g. "2026-06-04T14:00:00Z" */
  slaDeadline: string
  /** How many minutes remain before the SLA is breached */
  minutesRemaining: number
  dashboardUrl: string
}

/**
 * Sent to the assigned agent when a ticket is approaching its SLA deadline.
 * Fired when minutesRemaining drops below a configured threshold (e.g. 30 minutes).
 * Trigger logic lives in the SLA enforcement worker — this template is the payload.
 */
export function SlaBreachWarningEmail({
  agentName, ticketSubject, ticketId, customerName, slaDeadline, minutesRemaining, dashboardUrl,
}: SlaBreachWarningEmailProps) {
  const urgencyText = minutesRemaining <= 15 ? 'Respond immediately' : `${minutesRemaining} minutes remaining`
  const deadline = new Date(slaDeadline).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  return (
    <Html>
      <Head />
      <Preview>SLA breach warning: {ticketSubject} — {urgencyText}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={warningHeader}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>SLA breach warning</Heading>
            <Text style={text}>Hi {agentName},</Text>
            <Text style={text}>
              A ticket assigned to you is approaching its SLA deadline and requires your immediate attention.
            </Text>
            <Section style={warningBox}>
              <Text style={warningLabel}>SLA BREACH IN</Text>
              <Text style={urgencyDisplay}>{urgencyText}</Text>
              <Text style={deadlineText}>Deadline: {deadline}</Text>
            </Section>
            <Section style={ticketBox}>
              <Text style={ticketLabel}>TICKET</Text>
              <Text style={ticketSubjectStyle}>{ticketSubject}</Text>
              <Text style={ticketIdStyle}>#{ticketId.slice(-8).toUpperCase()} · {customerName}</Text>
            </Section>
            <Button style={button} href={dashboardUrl}>Respond now</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this because SLA enforcement is enabled for your SparkDesk workspace.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const warningHeader: React.CSSProperties = { backgroundColor: '#7f1d1d', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#fca5a5', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 16px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 12px' }
const warningBox: React.CSSProperties = { backgroundColor: '#fef2f2', borderRadius: '8px', padding: '16px 20px', margin: '24px 0', border: '1px solid #fecaca' }
const warningLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#dc2626', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const urgencyDisplay: React.CSSProperties = { fontSize: '20px', fontWeight: '700', color: '#dc2626', margin: '0 0 4px' }
const deadlineText: React.CSSProperties = { fontSize: '13px', color: '#71717a', margin: '0' }
const ticketBox: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px 20px', margin: '0 0 24px' }
const ticketLabel: React.CSSProperties = { fontSize: '11px', fontWeight: '600', color: '#71717a', letterSpacing: '0.08em', margin: '0 0 4px', textTransform: 'uppercase' }
const ticketSubjectStyle: React.CSSProperties = { fontSize: '15px', fontWeight: '600', color: '#09090B', margin: '0 0 4px' }
const ticketIdStyle: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#dc2626', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 6: Create `packages/email/src/templates/weekly-digest.tsx`**

```tsx
import {
  Body, Button, Column, Container, Head, Heading, Hr, Html,
  Preview, Row, Section, Text,
} from '@react-email/components'
import * as React from 'react'

export interface WeeklyDigestEmailProps {
  adminName: string
  /** Display string for week start, e.g. "Jun 2" */
  weekStart: string
  /** Display string for week end, e.g. "Jun 8" */
  weekEnd: string
  ticketsCreated: number
  ticketsResolved: number
  /** Average hours from open to resolved */
  avgResolutionHours: number
  openTickets: number
  dashboardUrl: string
}

/**
 * Weekly summary email sent to workspace admins every Monday morning.
 * Provides a top-level view of support volume and resolution performance.
 * Trigger: scheduled job in the background worker (not a route action).
 */
export function WeeklyDigestEmail({
  adminName, weekStart, weekEnd, ticketsCreated, ticketsResolved,
  avgResolutionHours, openTickets, dashboardUrl,
}: WeeklyDigestEmailProps) {
  const resolutionRate = ticketsCreated > 0
    ? Math.round((ticketsResolved / ticketsCreated) * 100)
    : 0

  return (
    <Html>
      <Head />
      <Preview>Your SparkDesk weekly summary — {weekStart} to {weekEnd}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <Text style={logo}>SparkDesk</Text>
          </Section>
          <Section style={content}>
            <Heading style={h1}>Weekly summary</Heading>
            <Text style={subtitle}>{weekStart} – {weekEnd}</Text>
            <Text style={text}>Hi {adminName}, here&apos;s how your team did this week.</Text>
            <Section style={statsGrid}>
              <Row>
                <Column style={statCell}>
                  <Text style={statNumber}>{ticketsCreated}</Text>
                  <Text style={statLabel}>Tickets opened</Text>
                </Column>
                <Column style={statCell}>
                  <Text style={statNumber}>{ticketsResolved}</Text>
                  <Text style={statLabel}>Tickets resolved</Text>
                </Column>
              </Row>
              <Row>
                <Column style={statCell}>
                  <Text style={statNumber}>{resolutionRate}%</Text>
                  <Text style={statLabel}>Resolution rate</Text>
                </Column>
                <Column style={statCell}>
                  <Text style={statNumber}>{avgResolutionHours.toFixed(1)}h</Text>
                  <Text style={statLabel}>Avg. resolution time</Text>
                </Column>
              </Row>
            </Section>
            {openTickets > 0 && (
              <Section style={openTicketsBox}>
                <Text style={openTicketsText}>
                  <strong>{openTickets}</strong> ticket{openTickets !== 1 ? 's' : ''} still open heading into next week.
                </Text>
              </Section>
            )}
            <Button style={button} href={dashboardUrl}>View full report</Button>
          </Section>
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>You&apos;re receiving this weekly digest because you&apos;re an admin on this SparkDesk workspace.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const body: React.CSSProperties = { backgroundColor: '#f6f6f6', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }
const container: React.CSSProperties = { backgroundColor: '#ffffff', margin: '0 auto', padding: '0', maxWidth: '600px' }
const header: React.CSSProperties = { backgroundColor: '#09090B', padding: '20px 32px' }
const logo: React.CSSProperties = { color: '#818CF8', fontSize: '18px', fontWeight: '700', margin: '0' }
const content: React.CSSProperties = { padding: '32px' }
const h1: React.CSSProperties = { fontSize: '22px', fontWeight: '700', color: '#09090B', margin: '0 0 4px' }
const subtitle: React.CSSProperties = { fontSize: '14px', color: '#71717a', margin: '0 0 20px' }
const text: React.CSSProperties = { fontSize: '15px', color: '#3f3f46', lineHeight: '24px', margin: '0 0 24px' }
const statsGrid: React.CSSProperties = { margin: '0 0 24px' }
const statCell: React.CSSProperties = { backgroundColor: '#f4f4f5', borderRadius: '8px', padding: '16px', textAlign: 'center', width: '50%' }
const statNumber: React.CSSProperties = { fontSize: '28px', fontWeight: '700', color: '#818CF8', margin: '0 0 4px', lineHeight: '1' }
const statLabel: React.CSSProperties = { fontSize: '12px', color: '#71717a', margin: '0', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }
const openTicketsBox: React.CSSProperties = { backgroundColor: '#fefce8', borderRadius: '8px', padding: '14px 20px', margin: '0 0 24px', border: '1px solid #fef08a' }
const openTicketsText: React.CSSProperties = { fontSize: '14px', color: '#713f12', margin: '0' }
const button: React.CSSProperties = { backgroundColor: '#818CF8', borderRadius: '6px', color: '#ffffff', fontSize: '14px', fontWeight: '600', padding: '12px 24px', display: 'inline-block' }
const hr: React.CSSProperties = { borderColor: '#e4e4e7', margin: '0' }
const footer: React.CSSProperties = { padding: '24px 32px' }
const footerText: React.CSSProperties = { fontSize: '12px', color: '#a1a1aa', lineHeight: '18px', margin: '0' }
```

- [ ] **Step 7: Update `packages/email/src/index.ts`**

Replace the placeholder with full exports:

```typescript
export { sendEmail } from './sender'
export type { SendEmailOptions } from './sender'

export { TicketCreatedEmail } from './templates/ticket-created'
export type { TicketCreatedEmailProps } from './templates/ticket-created'

export { TicketRepliedEmail } from './templates/ticket-replied'
export type { TicketRepliedEmailProps } from './templates/ticket-replied'

export { TicketResolvedEmail } from './templates/ticket-resolved'
export type { TicketResolvedEmailProps } from './templates/ticket-resolved'

export { AgentAssignedEmail } from './templates/agent-assigned'
export type { AgentAssignedEmailProps } from './templates/agent-assigned'

export { SlaBreachWarningEmail } from './templates/sla-breach-warning'
export type { SlaBreachWarningEmailProps } from './templates/sla-breach-warning'

export { WeeklyDigestEmail } from './templates/weekly-digest'
export type { WeeklyDigestEmailProps } from './templates/weekly-digest'
```

- [ ] **Step 8: Run tests**

```bash
pnpm --filter @sparkdesk/email test
```

Expected: PASS — 2 tests pass. (Tests only cover sender.ts — template rendering is validated by typecheck.)

- [ ] **Step 9: Typecheck**

```bash
pnpm --filter @sparkdesk/email typecheck
```

Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add packages/email/src/
git commit -m "feat(email): add 6 React Email templates (ticket lifecycle + SLA + weekly digest)"
```

---

### Task 3: Wire send calls into API routes + env docs

**Files:**
- Modify: `apps/api/package.json`
- Modify: `apps/api/src/routes/tickets.ts`
- Modify: `apps/api/.env.example`

The 4 events to wire: `TicketCreated` (on POST /), `TicketReplied` (on POST /:id/reply), `TicketResolved` (on PATCH when status → resolved), `AgentAssigned` (on PATCH when assigneeId changes). `SlaBreachWarning` and `WeeklyDigest` are periodic/scheduled — no trigger in routes.

- [ ] **Step 1: Add `@sparkdesk/email` to `apps/api/package.json`**

In `"dependencies"`, add after `@sparkdesk/analytics`:
```json
"@sparkdesk/email": "workspace:*",
```

Full dependencies after change:
```json
"dependencies": {
  "@hono/node-server": "^2.0.4",
  "@hono/zod-validator": "^0.8.0",
  "@prisma/client": "^5.16.0",
  "@sparkdesk/analytics": "workspace:*",
  "@sparkdesk/email": "workspace:*",
  "@sparkdesk/shared": "workspace:*",
  "hono": "^4.5.0",
  "zod": "^3.23.0"
},
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: `@sparkdesk/email` symlinked in `apps/api/node_modules`.

- [ ] **Step 3: Add email imports to `apps/api/src/routes/tickets.ts`**

Add after the existing imports at the top of the file:

```typescript
import * as React from 'react'
import {
  sendEmail,
  TicketCreatedEmail,
  TicketRepliedEmail,
  TicketResolvedEmail,
  AgentAssignedEmail,
} from '@sparkdesk/email'
```

Also add this constant near the top, after the imports:
```typescript
const APP_URL = process.env.WEB_APP_URL ?? 'http://localhost:3000'
```

- [ ] **Step 4: Wire TicketCreated email in POST /**

In the `ticketRoutes.post('/')` handler, after the `capture('ticket_created', ...)` call and before `return c.json(ticket, 201)`, add:

```typescript
  void sendEmail({
    to: ticket.customer.email,
    subject: `[SparkDesk] We've received your request: ${ticket.subject}`,
    react: React.createElement(TicketCreatedEmail, {
      customerName: ticket.customer.name,
      ticketSubject: ticket.subject,
      ticketId: ticket.id,
      supportUrl: `${APP_URL}/tickets/${ticket.id}`,
    }),
  })
```

- [ ] **Step 5: Wire TicketReplied email in POST /:id/reply**

In the `ticketRoutes.post('/:id/reply')` handler, after `capture('ticket_reply_sent', ...)` and before `return c.json(message, 201)`, fetch the ticket and customer, then send:

```typescript
  const ticketForEmail = await db.ticket.findFirst({
    where: { id: c.req.param('id') },
    include: { customer: true },
  })
  if (ticketForEmail) {
    void sendEmail({
      to: ticketForEmail.customer.email,
      subject: `[SparkDesk] New reply on your ticket: ${ticketForEmail.subject}`,
      react: React.createElement(TicketRepliedEmail, {
        customerName: ticketForEmail.customer.name,
        ticketSubject: ticketForEmail.subject,
        ticketId: ticketForEmail.id,
        agentName: 'Support Team',
        replyBody: body,
        supportUrl: `${APP_URL}/tickets/${ticketForEmail.id}`,
      }),
    })
  }
```

Note: `agentName` is hardcoded to `'Support Team'` because the route only receives `agentId` in the header, not the agent's display name. A production implementation would join on the agent table — for the demo this is fine.

- [ ] **Step 6: Wire TicketResolved and AgentAssigned emails in PATCH /:id**

In the `ticketRoutes.patch('/:id')` handler, after `capture('ticket_updated', ...)` and before `return c.json({ ok: true })`, add:

```typescript
  // Send TicketResolved to customer when status transitions to resolved
  if (data.status === 'resolved') {
    const resolvedTicket = await db.ticket.findFirst({
      where: { id: c.req.param('id') },
      include: { customer: true },
    })
    if (resolvedTicket) {
      void sendEmail({
        to: resolvedTicket.customer.email,
        subject: `[SparkDesk] Your ticket has been resolved: ${resolvedTicket.subject}`,
        react: React.createElement(TicketResolvedEmail, {
          customerName: resolvedTicket.customer.name,
          ticketSubject: resolvedTicket.subject,
          ticketId: resolvedTicket.id,
          agentName: 'Support Team',
          supportUrl: `${APP_URL}/tickets/${resolvedTicket.id}`,
        }),
      })
    }
  }

  // Send AgentAssigned to the newly assigned agent
  if ('assigneeId' in data && data.assigneeId) {
    const assignedTicket = await db.ticket.findFirst({
      where: { id: c.req.param('id') },
      include: { customer: true, assignee: true },
    })
    if (assignedTicket?.assignee) {
      void sendEmail({
        to: assignedTicket.assignee.email,
        subject: `[SparkDesk] Ticket assigned to you: ${assignedTicket.subject}`,
        react: React.createElement(AgentAssignedEmail, {
          agentName: assignedTicket.assignee.name,
          ticketSubject: assignedTicket.subject,
          ticketId: assignedTicket.id,
          customerName: assignedTicket.customer.name,
          priority: assignedTicket.priority,
          dashboardUrl: `${APP_URL}/tickets/${assignedTicket.id}`,
        }),
      })
    }
  }
```

- [ ] **Step 7: Update `apps/api/.env.example`**

Add after the existing PostHog section:

```
# Resend transactional email (optional — all send calls no-op when unset)
RESEND_API_KEY=""
EMAIL_FROM="SparkDesk <noreply@sparkdesk.io>"
```

- [ ] **Step 8: Typecheck**

```bash
cd apps/api && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 9: Verify API still starts**

```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
nohup pnpm --filter @sparkdesk/api dev > /tmp/sparkdesk-api.log 2>&1 &
sleep 4
curl -s http://localhost:3001/health
```

Expected: `{"ok":true}`

- [ ] **Step 10: Commit**

```bash
git add apps/api/
git commit -m "feat(api): wire transactional email sends into ticket route handlers"
```

---

## Environment Variables Added

| Variable | Package | Required | Description |
|---|---|---|---|
| `RESEND_API_KEY` | `apps/api` | No | Resend API key — all sends no-op when absent |
| `EMAIL_FROM` | `apps/api` | No | From address, defaults to `SparkDesk <noreply@sparkdesk.io>` |

---

## What Voltage Crawls After This Phase

| File | Templates / Functions |
|------|----------------------|
| `packages/email/src/templates/ticket-created.tsx` | `TicketCreatedEmail` — props: customerName, ticketSubject, ticketId, supportUrl |
| `packages/email/src/templates/ticket-replied.tsx` | `TicketRepliedEmail` — props: + agentName, replyBody |
| `packages/email/src/templates/ticket-resolved.tsx` | `TicketResolvedEmail` — props: + agentName |
| `packages/email/src/templates/agent-assigned.tsx` | `AgentAssignedEmail` — props: agentName, ticketSubject, ticketId, customerName, priority, dashboardUrl |
| `packages/email/src/templates/sla-breach-warning.tsx` | `SlaBreachWarningEmail` — props: + slaDeadline, minutesRemaining |
| `packages/email/src/templates/weekly-digest.tsx` | `WeeklyDigestEmail` — props: adminName, weekStart/End, ticketsCreated/Resolved, avgResolutionHours, openTickets |
| `packages/email/src/sender.ts` | `sendEmail()` — provider wrapper (Resend) |

Six templates with typed props in one package — invisible to product and marketing until Voltage crawls them.
