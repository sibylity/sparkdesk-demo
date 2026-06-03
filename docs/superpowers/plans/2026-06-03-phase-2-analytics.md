# Phase 2: Analytics Package & Distributed Event Tracking

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `packages/analytics` as the shared PostHog client + property schema hub, then add distributed event tracking across `apps/api` and `apps/web` — demonstrating the crawl-and-discover use case Voltage was built for.

**Architecture:** A single `@sparkdesk/analytics` package owns the server-side PostHog client (posthog-node) and the shared TypeScript property schemas that every event across every app must extend. Each app defines its own events co-located with the code that fires them (`apps/api/src/analytics/events.ts`, `apps/web/src/analytics/events.ts`), importing only the shared property types — not the client — from the package. Web uses posthog-js (browser SDK) directly with a `PostHogProvider` wrapper. Events are actually fired in route handlers and UI components so the demo is live.

**Tech Stack:** posthog-node 4.x (server), posthog-js 1.x (browser), Hono route handlers, Next.js 15 App Router, vitest for analytics package tests

---

## File Structure

| File | Status | Responsibility |
|------|--------|----------------|
| `packages/analytics/package.json` | Create | Package manifest, posthog-node dep, vitest dev dep |
| `packages/analytics/tsconfig.json` | Create | TypeScript config matching other packages |
| `packages/analytics/src/properties.ts` | Create | `UserProperties`, `OrgProperties`, `BaseEventProperties` — the shared schemas every event extends |
| `packages/analytics/src/client.ts` | Create | `getAnalyticsClient()` + `capture()` — wraps posthog-node, no-ops when `POSTHOG_API_KEY` absent |
| `packages/analytics/src/index.ts` | Create | Re-exports everything from properties.ts and client.ts |
| `apps/api/src/analytics/events.ts` | Create | 5 typed track functions for API-layer events (ticket lifecycle) |
| `apps/web/src/analytics/posthog.ts` | Create | posthog-js singleton init — called once from the provider |
| `apps/web/src/analytics/events.ts` | Create | 4 typed track functions for UI events (inbox filter, ticket open, reply, nav) |
| `apps/web/src/components/providers.tsx` | Create | `PostHogProvider` client component — init posthog-js + identify user |
| `apps/api/package.json` | Modify | Add `@sparkdesk/analytics: workspace:*` |
| `apps/web/package.json` | Modify | Add `posthog-js`, `@sparkdesk/analytics: workspace:*` |
| `apps/api/src/routes/tickets.ts` | Modify | Call track functions after ticket mutations |
| `apps/web/src/app/layout.tsx` | Modify | Wrap app in `PostHogProvider` |
| `apps/web/src/components/tickets/ticket-list.tsx` | Modify | Call `trackInboxFilterApplied` when active filter changes |
| `apps/web/src/components/layout/sidebar.tsx` | Modify | Call `trackNavItemClicked` on link click |

---

### Task 1: Create `packages/analytics` — property schemas, PostHog server client, tests

**Files:**
- Create: `packages/analytics/package.json`
- Create: `packages/analytics/tsconfig.json`
- Create: `packages/analytics/src/properties.ts`
- Create: `packages/analytics/src/client.ts`
- Create: `packages/analytics/src/client.test.ts`
- Create: `packages/analytics/src/index.ts`

- [ ] **Step 1: Create `packages/analytics/package.json`**

```json
{
  "name": "@sparkdesk/analytics",
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
    "posthog-node": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "typescript": "^5.5.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2: Create `packages/analytics/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Install dependencies**

```bash
pnpm --filter @sparkdesk/analytics install
```

Expected: `posthog-node` and `vitest` installed in `packages/analytics/node_modules`.

- [ ] **Step 4: Write the failing test first**

Create `packages/analytics/src/client.test.ts`:

```typescript
import { describe, it, expect, afterEach } from 'vitest'

describe('analytics client', () => {
  afterEach(() => {
    delete process.env.POSTHOG_API_KEY
  })

  it('getAnalyticsClient returns null when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
    // Dynamic import to get a fresh module evaluation
    const { getAnalyticsClient } = await import('./client')
    expect(getAnalyticsClient()).toBeNull()
  })

  it('capture does not throw when POSTHOG_API_KEY is not set', async () => {
    delete process.env.POSTHOG_API_KEY
    const { capture } = await import('./client')
    expect(() =>
      capture('test_event', { distinctId: 'user-1', orgId: 'org-1' })
    ).not.toThrow()
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

```bash
pnpm --filter @sparkdesk/analytics test
```

Expected: FAIL — `Cannot find module './client'`

- [ ] **Step 6: Create `packages/analytics/src/properties.ts`**

```typescript
/**
 * Shared property schemas for all SparkDesk analytics events.
 * Every event across apps/api and apps/web extends BaseEventProperties
 * so Voltage can correlate them into a unified taxonomy.
 */

export interface UserProperties {
  /** WorkOS user ID or agent ID */
  userId: string
  /** Agent's display email */
  userEmail?: string
  /** WorkOS Organization ID */
  orgId: string
  /** Organization display name */
  orgName?: string
  /** Agent role within the organization */
  agentRole?: 'admin' | 'agent'
}

export interface OrgProperties {
  orgId: string
  orgName?: string
  /** Billing plan for the organization */
  orgPlan?: 'free' | 'pro' | 'enterprise'
}

/**
 * Base properties carried by every server-side event.
 * Client-side events (posthog-js) extend this partially —
 * posthog-js attaches user identity automatically after posthog.identify().
 */
export interface BaseEventProperties extends OrgProperties {
  userId?: string
  userEmail?: string
  environment?: 'development' | 'production' | 'test'
}
```

- [ ] **Step 7: Create `packages/analytics/src/client.ts`**

```typescript
import { PostHog } from 'posthog-node'

let _client: PostHog | null = null

/**
 * Returns the PostHog server-side client.
 * Returns null (and is a safe no-op) when POSTHOG_API_KEY is not set —
 * so local development and CI work without a PostHog account.
 */
export function getAnalyticsClient(): PostHog | null {
  if (_client) return _client
  if (!process.env.POSTHOG_API_KEY) return null

  _client = new PostHog(process.env.POSTHOG_API_KEY, {
    host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
  })
  return _client
}

/**
 * Fire a server-side event. No-ops when PostHog is not configured.
 * The `distinctId` field is required and should be the primary actor
 * (orgId for workspace-level events, agentId for agent-level events).
 */
export function capture(
  event: string,
  properties: Record<string, unknown> & { distinctId: string }
): void {
  const { distinctId, ...rest } = properties
  getAnalyticsClient()?.capture({ distinctId, event, properties: rest })
}

/** Call during server shutdown to flush queued events. */
export async function shutdownAnalytics(): Promise<void> {
  await getAnalyticsClient()?.shutdown()
}
```

- [ ] **Step 8: Create `packages/analytics/src/index.ts`**

```typescript
export * from './properties'
export { getAnalyticsClient, capture, shutdownAnalytics } from './client'
```

- [ ] **Step 9: Run tests — expect them to pass**

```bash
pnpm --filter @sparkdesk/analytics test
```

Expected: PASS — 2 tests pass.

- [ ] **Step 10: Run typecheck**

```bash
pnpm --filter @sparkdesk/analytics typecheck
```

Expected: no errors.

- [ ] **Step 11: Commit**

```bash
git add packages/analytics/
git commit -m "feat(analytics): add shared PostHog client + property schemas package"
```

---

### Task 2: API event definitions + wire into ticket route handlers

**Files:**
- Modify: `apps/api/package.json`
- Create: `apps/api/src/analytics/events.ts`
- Modify: `apps/api/src/routes/tickets.ts`

- [ ] **Step 1: Add `@sparkdesk/analytics` to `apps/api/package.json`**

Open `apps/api/package.json`. In the `"dependencies"` block, add after `@sparkdesk/shared`:

```json
"@sparkdesk/analytics": "workspace:*",
```

Full dependencies block after change:
```json
"dependencies": {
  "@hono/node-server": "^2.0.4",
  "@hono/zod-validator": "^0.8.0",
  "@prisma/client": "^5.16.0",
  "@sparkdesk/analytics": "workspace:*",
  "@sparkdesk/shared": "workspace:*",
  "hono": "^4.5.0",
  "zod": "^3.23.0"
},
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: `@sparkdesk/analytics` symlinked into `apps/api/node_modules`.

- [ ] **Step 3: Create `apps/api/src/analytics/events.ts`**

```typescript
import { capture } from '@sparkdesk/analytics'
import type { BaseEventProperties } from '@sparkdesk/analytics'

/**
 * API-layer analytics events for SparkDesk.
 *
 * These events fire from Hono route handlers in apps/api.
 * Voltage crawls this file alongside apps/web/src/analytics/events.ts
 * to build the full cross-app event taxonomy.
 *
 * All events extend BaseEventProperties from @sparkdesk/analytics,
 * ensuring consistent user and org context across the entire event catalog.
 */

// ─── Ticket Created ──────────────────────────────────────────────────────────

export interface TicketCreatedProperties extends BaseEventProperties {
  ticketId: string
  /** The channel through which the ticket was submitted */
  channel: 'email' | 'slack' | 'web' | 'api'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  /** Whether the ticket was assigned to an agent at creation time */
  hasAssignee: boolean
}

export function trackTicketCreated(props: TicketCreatedProperties): void {
  capture('ticket_created', { distinctId: props.orgId, ...props })
}

// ─── Ticket Status Changed ───────────────────────────────────────────────────

export interface TicketStatusChangedProperties extends BaseEventProperties {
  ticketId: string
  previousStatus: string
  newStatus: string
}

export function trackTicketStatusChanged(props: TicketStatusChangedProperties): void {
  capture('ticket_status_changed', { distinctId: props.orgId, ...props })
}

// ─── Ticket Reply Sent ───────────────────────────────────────────────────────

export interface TicketReplySentProperties extends BaseEventProperties {
  ticketId: string
  /** The agent who sent the reply */
  agentId: string
  /** Character count of the reply body */
  bodyLength: number
}

export function trackTicketReplySent(props: TicketReplySentProperties): void {
  capture('ticket_reply_sent', { distinctId: props.agentId, ...props })
}

// ─── Internal Note Added ─────────────────────────────────────────────────────

export interface TicketNoteAddedProperties extends BaseEventProperties {
  ticketId: string
  /** The agent who added the note */
  agentId: string
}

export function trackTicketNoteAdded(props: TicketNoteAddedProperties): void {
  capture('ticket_note_added', { distinctId: props.agentId, ...props })
}

// ─── Ticket Assigned ─────────────────────────────────────────────────────────

export interface TicketAssignedProperties extends BaseEventProperties {
  ticketId: string
  /** The agent the ticket was assigned to */
  assigneeId: string
}

export function trackTicketAssigned(props: TicketAssignedProperties): void {
  capture('ticket_assigned', { distinctId: props.orgId, ...props })
}
```

- [ ] **Step 4: Wire events into `apps/api/src/routes/tickets.ts`**

Add imports at the top of the file (after the existing imports):

```typescript
import {
  trackTicketCreated,
  trackTicketStatusChanged,
  trackTicketReplySent,
  trackTicketNoteAdded,
  trackTicketAssigned,
} from '../analytics/events'
```

In the `POST /` (create ticket) handler, add after the `db.ticket.create(...)` call and before `return c.json(ticket, 201)`:

```typescript
  trackTicketCreated({
    orgId,
    ticketId: ticket.id,
    channel: data.channel as 'email' | 'slack' | 'web' | 'api',
    priority: data.priority as 'urgent' | 'high' | 'normal' | 'low',
    hasAssignee: data.assigneeId != null,
  })
```

In the `PATCH /:id` (update ticket) handler, add after the `db.ticket.updateMany(...)` call and before `return c.json({ ok: true })`:

```typescript
  if (data.status) {
    trackTicketStatusChanged({
      orgId,
      ticketId: c.req.param('id'),
      previousStatus: 'unknown',
      newStatus: data.status,
    })
  }
  if ('assigneeId' in data && data.assigneeId) {
    trackTicketAssigned({
      orgId,
      ticketId: c.req.param('id'),
      assigneeId: data.assigneeId,
    })
  }
```

In the `POST /:id/reply` handler, add after the `db.$transaction(...)` call and before `return c.json(message, 201)`:

```typescript
  trackTicketReplySent({
    orgId,
    agentId,
    ticketId: c.req.param('id'),
    bodyLength: body.length,
  })
```

In the `POST /:id/notes` handler, add after `db.note.create(...)` and before `return c.json(note, 201)`:

```typescript
  trackTicketNoteAdded({
    orgId,
    agentId,
    ticketId: c.req.param('id'),
  })
```

- [ ] **Step 5: Verify API still starts**

```bash
pnpm --filter @sparkdesk/api exec tsx src/index.ts &
sleep 3
curl -s http://localhost:3001/health
```

Expected: `{"ok":true}`

Kill the test process: `lsof -ti:3001 | xargs kill -9`

- [ ] **Step 6: Typecheck**

```bash
pnpm --filter @sparkdesk/api exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/
git commit -m "feat(api): add distributed event tracking for ticket lifecycle"
```

---

### Task 3: Web PostHog browser setup — provider + user identification

**Files:**
- Modify: `apps/web/package.json`
- Create: `apps/web/src/analytics/posthog.ts`
- Create: `apps/web/src/components/providers.tsx`
- Modify: `apps/web/src/app/layout.tsx`

- [ ] **Step 1: Add dependencies to `apps/web/package.json`**

In `"dependencies"`, add:

```json
"@sparkdesk/analytics": "workspace:*",
"posthog-js": "^1.0.0",
```

Full `dependencies` block after change:
```json
"dependencies": {
  "@base-ui/react": "^1.5.0",
  "@sparkdesk/analytics": "workspace:*",
  "@sparkdesk/shared": "workspace:*",
  "@workos-inc/authkit-nextjs": "^0.13.0",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "lucide-react": "^1.17.0",
  "next": "^15.0.0",
  "posthog-js": "^1.0.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "shadcn": "^4.10.0",
  "tailwind-merge": "^2.6.1",
  "tw-animate-css": "^1.4.0",
  "zod": "^3.23.0"
},
```

- [ ] **Step 2: Install**

```bash
pnpm install
```

Expected: `posthog-js` installed, `@sparkdesk/analytics` symlinked.

- [ ] **Step 3: Create `apps/web/src/analytics/posthog.ts`**

This is the browser-side PostHog client. It's a singleton that's safe to import from any client component.

```typescript
import posthog from 'posthog-js'

/**
 * Initialize posthog-js for the browser.
 * Called once from PostHogProvider on mount.
 * No-ops when NEXT_PUBLIC_POSTHOG_KEY is not set (local dev without a PostHog account).
 */
export function initPostHog(): void {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || typeof window === 'undefined') return

  posthog.init(key, {
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    // We call posthog.capture() manually so autocapture is disabled for cleaner demo events
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    loaded: (ph) => {
      if (process.env.NODE_ENV === 'development') ph.debug()
    },
  })
}

/**
 * Identify the current agent in PostHog.
 * Call after auth resolves — associates all subsequent events with this user.
 */
export function identifyAgent(params: {
  userId: string
  email?: string
  name?: string
  orgId: string
}): void {
  if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  posthog.identify(params.userId, {
    email: params.email,
    name: params.name,
    orgId: params.orgId,
  })
}

export { posthog }
```

- [ ] **Step 4: Create `apps/web/src/components/providers.tsx`**

```tsx
'use client'
import { useEffect } from 'react'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { posthog, initPostHog, identifyAgent } from '@/analytics/posthog'

interface ProvidersProps {
  children: React.ReactNode
  /** WorkOS user ID — passed down from the server layout */
  userId: string
  /** Agent display name */
  name: string
  /** Agent email */
  email?: string
  /** WorkOS Organization ID */
  orgId: string
}

export function Providers({ children, userId, name, email, orgId }: ProvidersProps) {
  useEffect(() => {
    initPostHog()
    identifyAgent({ userId, name, email, orgId })
  }, [userId, name, email, orgId])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
```

- [ ] **Step 5: Update `apps/web/src/app/layout.tsx` to pass auth context to Providers**

The existing `layout.tsx` already calls `withAuth`. Update it to extract user data and pass to the `Providers` wrapper.

Current file:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'SparkDesk',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
```

Replace with:
```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Geist } from 'next/font/google'
import { cn } from '@/lib/utils'
import { Providers } from '@/components/providers'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'SparkDesk',
}

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? 'demo-org'
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? 'demo-agent'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn('font-sans', geist.variable)}>
      <body>
        <Providers
          userId={DEMO_AGENT_ID}
          name="Jamie Diaz"
          email="jamie@sparkdesk.io"
          orgId={DEMO_ORG_ID}
        >
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

Note: We use the DEMO_AGENT_ID directly here because the root layout is outside the `(app)` group that calls `withAuth`. The app-level layouts handle authentication; the root layout just sets up providers.

- [ ] **Step 6: Add PostHog ingest rewrite to `apps/web/next.config.ts` (or `next.config.js`)**

First check if next.config exists:

```bash
ls apps/web/next.config.*
```

If `next.config.ts` exists, open it and add rewrites so PostHog API calls proxy through `/ingest` (avoids ad blockers):

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://us-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://us.i.posthog.com/:path*',
      },
    ]
  },
  // Required for PostHog ingest proxy
  skipTrailingSlashRedirect: true,
}

export default nextConfig
```

If `next.config.js` exists, adapt accordingly. If neither exists, create `apps/web/next.config.ts` with the content above.

- [ ] **Step 7: Typecheck**

```bash
pnpm --filter @sparkdesk/web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 8: Start web server and verify no console errors**

```bash
pnpm --filter @sparkdesk/web dev &
sleep 5
curl -s http://localhost:3000/inbox -o /dev/null -w "%{http_code}"
```

Expected: `307` (auth redirect, which is correct — page requires login)

- [ ] **Step 9: Commit**

```bash
git add apps/web/
git commit -m "feat(web): add PostHog browser provider + agent identification"
```

---

### Task 4: Web event definitions + wire into TicketList and Sidebar

**Files:**
- Create: `apps/web/src/analytics/events.ts`
- Modify: `apps/web/src/components/tickets/ticket-list.tsx`
- Modify: `apps/web/src/components/layout/sidebar.tsx`

- [ ] **Step 1: Create `apps/web/src/analytics/events.ts`**

```typescript
import { posthog } from './posthog'
import type { BaseEventProperties } from '@sparkdesk/analytics'

/**
 * UI/dashboard analytics events for the SparkDesk web app.
 *
 * These events fire from client components in apps/web.
 * Voltage crawls this file alongside apps/api/src/analytics/events.ts
 * to build the full cross-app event taxonomy.
 *
 * User identity is set once via posthog.identify() in PostHogProvider —
 * posthog-js attaches it automatically to every event captured here.
 * BaseEventProperties fields are Partial because posthog-js handles them.
 */

// ─── Inbox Filter Applied ────────────────────────────────────────────────────

export interface InboxFilterAppliedProperties extends Partial<BaseEventProperties> {
  /** The dimension being filtered on */
  filterType: 'status' | 'assignee'
  /** The selected filter value (e.g. "open", "resolved", "me") */
  filterValue: string
}

export function trackInboxFilterApplied(props: InboxFilterAppliedProperties): void {
  posthog.capture('inbox_filter_applied', props)
}

// ─── Ticket Opened ───────────────────────────────────────────────────────────

export interface TicketOpenedProperties extends Partial<BaseEventProperties> {
  ticketId: string
  ticketStatus: string
  ticketPriority: string
}

export function trackTicketOpened(props: TicketOpenedProperties): void {
  posthog.capture('ticket_opened', props)
}

// ─── Reply Submitted ─────────────────────────────────────────────────────────

export interface ReplySubmittedProperties extends Partial<BaseEventProperties> {
  ticketId: string
  /** "reply" = sent to customer, "note" = internal note */
  replyType: 'reply' | 'note'
  /** Character count of the reply body */
  bodyLength: number
}

export function trackReplySubmitted(props: ReplySubmittedProperties): void {
  posthog.capture('reply_submitted', props)
}

// ─── Nav Item Clicked ────────────────────────────────────────────────────────

export interface NavItemClickedProperties extends Partial<BaseEventProperties> {
  /** The href/destination of the nav item clicked */
  destination: string
  /** Display label of the nav item */
  label: string
}

export function trackNavItemClicked(props: NavItemClickedProperties): void {
  posthog.capture('nav_item_clicked', props)
}
```

- [ ] **Step 2: Wire `trackInboxFilterApplied` into `apps/web/src/components/tickets/ticket-list.tsx`**

The `TicketList` component is already a `'use client'` component with a `setActiveFilter` call. Add the import and call `trackInboxFilterApplied` when the filter changes.

Add import at the top:
```typescript
import { trackInboxFilterApplied } from '@/analytics/events'
```

Find the filter button's `onClick`. Currently the component calls `setActiveFilter(f.value)` when a filter tab is clicked. Update the filter click handler to also fire the event.

Locate the filter tabs rendering (the `filters.map(...)` block). The filter buttons currently call `setActiveFilter(f.value)`. Change that handler to:

```typescript
onClick={() => {
  setActiveFilter(f.value)
  trackInboxFilterApplied({
    filterType: 'status',
    filterValue: f.value,
  })
}}
```

- [ ] **Step 3: Wire `trackNavItemClicked` into `apps/web/src/components/layout/sidebar.tsx`**

Add import at the top:
```typescript
import { trackNavItemClicked } from '@/analytics/events'
```

Find the `<Link>` inside `navItems.map(...)`. Add an `onClick` handler:

```tsx
<Link
  key={item.href}
  href={item.href}
  onClick={() => trackNavItemClicked({ destination: item.href, label: item.label })}
  className={cn(
    'flex items-center justify-between rounded px-2.5 py-[5px] text-[13px] transition-colors',
    pathname === item.href ? 'font-medium' : 'font-[450]'
  )}
  style={{
    color: pathname === item.href ? 'var(--text-primary)' : 'var(--text-secondary)',
    background: pathname === item.href ? 'var(--bg-hover)' : 'transparent',
  }}
>
  {item.label}
</Link>
```

- [ ] **Step 4: Typecheck**

```bash
pnpm --filter @sparkdesk/web exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Start dev server and manually verify events fire**

Start the server if it isn't running:
```bash
pnpm --filter @sparkdesk/web dev &
sleep 5
```

Open http://localhost:3000 in a browser, sign in, and open the browser console. If `NEXT_PUBLIC_POSTHOG_KEY` is set in `.env.local`, events will appear in the PostHog Live Events tab. Without a key, the library is a no-op — verify by checking that clicking a filter tab and nav item does not throw any console errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/analytics/ apps/web/src/components/tickets/ticket-list.tsx apps/web/src/components/layout/sidebar.tsx
git commit -m "feat(web): add distributed UI event tracking — inbox filter, nav, ticket interactions"
```

---

## Environment Variables

Add to `apps/web/.env.local` if you have a PostHog project key:

```
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key_here
```

Add to `apps/api/.env` (or `.env.local`) if you want server-side events to flow:

```
POSTHOG_API_KEY=phc_your_key_here
```

Both are optional — all analytics calls no-op gracefully when keys are absent.

---

## What Voltage Crawls After This Phase

| File | Events defined |
|------|---------------|
| `apps/api/src/analytics/events.ts` | `ticket_created`, `ticket_status_changed`, `ticket_reply_sent`, `ticket_note_added`, `ticket_assigned` |
| `apps/web/src/analytics/events.ts` | `inbox_filter_applied`, `ticket_opened`, `reply_submitted`, `nav_item_clicked` |
| `packages/analytics/src/properties.ts` | `BaseEventProperties`, `UserProperties`, `OrgProperties` — the shared schema hub |

This creates exactly the "events scattered across distributed packages, shared schemas in one place, no central inventory without tooling" scenario that Voltage was built for.
