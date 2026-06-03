# SparkDesk Phase 1 — Foundation + Core Ticket System

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the full monorepo and deliver a working help desk — agents can log in, view a ticket inbox, open ticket details, reply to customers, add internal notes, and manage ticket status.

**Architecture:** Turborepo monorepo with `apps/web` (Next.js 15), `apps/api` (Hono), and `packages/shared` (Zod + TypeScript types). `apps/api` owns the Prisma database connection and all business logic. `apps/web` is a pure consumer of the internal API. WorkOS AuthKit handles authentication in `apps/web`; the API validates requests via a shared service token.

**Tech Stack:** Turborepo 2, pnpm workspaces, Next.js 15 (App Router), Hono 4, Prisma 5, PostgreSQL, WorkOS AuthKit, shadcn/ui, Tailwind CSS 4, Zod, TypeScript 5

---

## Prerequisites

Before starting:
- PostgreSQL running locally (or a Supabase/Neon free tier connection string ready)
- Node.js 22+, pnpm 9+ installed
- WorkOS account created at workos.com (free) — you'll need `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, and `WORKOS_REDIRECT_URI`
- A WorkOS Organization created in their dashboard for your demo workspace

---

## File Map

```
sparkdesk-demo/
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .env.example
│
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           ├── index.ts               re-exports everything
│           ├── types/
│           │   ├── ticket.ts          Ticket, TicketStatus, TicketPriority, TicketChannel
│           │   ├── customer.ts        Customer
│           │   ├── agent.ts           Agent, AgentRole
│           │   └── organization.ts    Organization
│           └── schemas/
│               ├── ticket.ts          Zod schemas for ticket create/update/reply
│               ├── customer.ts        Zod schemas for customer upsert
│               └── agent.ts           Zod schemas for agent update
│
├── apps/
│   ├── api/
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.ts               Hono app entry, registers all routes
│   │       ├── db.ts                  Prisma client singleton
│   │       ├── middleware/
│   │       │   └── auth.ts            service token validation middleware
│   │       ├── routes/
│   │       │   ├── tickets.ts         /internal/tickets CRUD
│   │       │   ├── customers.ts       /internal/customers CRUD
│   │       │   └── agents.ts          /internal/agents CRUD
│   │       └── prisma/
│   │           └── schema.prisma      all models: Ticket, Customer, Agent, Organization, Message, Note
│   │
│   └── web/
│       ├── package.json
│       ├── .env.example
│       ├── tailwind.config.ts
│       ├── components.json            shadcn/ui config
│       └── src/
│           ├── app/
│           │   ├── layout.tsx         root layout, WorkOS session provider
│           │   ├── page.tsx           redirects → /inbox
│           │   ├── auth/
│           │   │   ├── callback/
│           │   │   │   └── route.ts   WorkOS OAuth callback handler
│           │   │   └── login/
│           │   │       └── page.tsx   login page (WorkOS AuthKit UI)
│           │   └── (app)/             route group, requires auth
│           │       ├── layout.tsx     app shell: sidebar + main
│           │       ├── inbox/
│           │       │   └── page.tsx   ticket inbox list
│           │       ├── tickets/
│           │       │   └── [id]/
│           │       │       └── page.tsx  ticket detail
│           │       ├── customers/
│           │       │   └── page.tsx
│           │       └── settings/
│           │           └── page.tsx
│           ├── components/
│           │   ├── layout/
│           │   │   ├── sidebar.tsx    nav sidebar
│           │   │   └── shell.tsx      app shell wrapper
│           │   ├── tickets/
│           │   │   ├── ticket-list.tsx      inbox ticket rows
│           │   │   ├── ticket-item.tsx      single ticket row
│           │   │   ├── ticket-detail.tsx    detail panel
│           │   │   ├── ticket-thread.tsx    message thread
│           │   │   ├── reply-box.tsx        reply / internal note composer
│           │   │   └── status-badge.tsx     colored status tag
│           │   └── ui/                shadcn/ui generated components
│           ├── lib/
│           │   ├── api-client.ts      typed fetch wrapper → apps/api
│           │   └── utils.ts           cn() helper
│           └── middleware.ts          WorkOS session guard (redirects to login)
```

---

## Task 1: Monorepo scaffold

**Files:**
- Create: `turbo.json`
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)

- [ ] **Step 1: Initialize the repo**

```bash
cd ~/workspace/repos/sparkdesk-demo
pnpm init
```

- [ ] **Step 2: Write root `package.json`**

```json
{
  "name": "sparkdesk-demo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0"
  },
  "packageManager": "pnpm@9.15.1",
  "engines": { "node": ">=22.0.0" }
}
```

- [ ] **Step 3: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Write `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {}
  }
}
```

- [ ] **Step 5: Install root deps**

```bash
pnpm install
```

Expected: `node_modules/.pnpm` created, no errors.

- [ ] **Step 6: Commit**

```bash
git add turbo.json pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "chore: monorepo scaffold — turbo + pnpm workspaces"
```

---

## Task 2: `packages/shared` — core types and Zod schemas

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/types/ticket.ts`
- Create: `packages/shared/src/types/customer.ts`
- Create: `packages/shared/src/types/agent.ts`
- Create: `packages/shared/src/types/organization.ts`
- Create: `packages/shared/src/schemas/ticket.ts`
- Create: `packages/shared/src/schemas/customer.ts`
- Create: `packages/shared/src/schemas/agent.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create package scaffolding**

```bash
mkdir -p packages/shared/src/types packages/shared/src/schemas
```

- [ ] **Step 2: Write `packages/shared/package.json`**

```json
{
  "name": "@sparkdesk/shared",
  "version": "0.0.1",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

- [ ] **Step 3: Write `packages/shared/tsconfig.json`**

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

- [ ] **Step 4: Write `packages/shared/src/types/ticket.ts`**

```typescript
export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_on_customer'
  | 'resolved'
  | 'closed'
  | 'snoozed'
  | 'spam'

export type TicketPriority = 'urgent' | 'high' | 'normal' | 'low'

export type TicketChannel = 'web' | 'api' | 'slack' | 'email'

export interface Ticket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  organizationId: string
  customerId: string
  assigneeId: string | null
  slaDeadline: string | null  // ISO 8601
  createdAt: string
  updatedAt: string
}

export interface TicketMessage {
  id: string
  ticketId: string
  body: string
  authorType: 'customer' | 'agent'
  authorId: string
  createdAt: string
}

export interface TicketNote {
  id: string
  ticketId: string
  body: string
  authorId: string
  createdAt: string
}
```

- [ ] **Step 5: Write `packages/shared/src/types/customer.ts`**

```typescript
export interface Customer {
  id: string
  externalId: string | null
  name: string
  email: string
  company: string | null
  organizationId: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 6: Write `packages/shared/src/types/agent.ts`**

```typescript
export type AgentRole = 'admin' | 'agent'

export interface Agent {
  id: string
  name: string
  email: string
  role: AgentRole
  organizationId: string
  workosUserId: string
  createdAt: string
}
```

- [ ] **Step 7: Write `packages/shared/src/types/organization.ts`**

```typescript
export interface Organization {
  id: string
  name: string
  workosOrganizationId: string
  plan: 'free' | 'pro' | 'enterprise'
  createdAt: string
}
```

- [ ] **Step 8: Write `packages/shared/src/schemas/ticket.ts`**

```typescript
import { z } from 'zod'

export const CreateTicketSchema = z.object({
  subject: z.string().min(1).max(255),
  body: z.string().min(1),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  channel: z.enum(['web', 'api', 'slack', 'email']).default('web'),
  customerId: z.string(),
  assigneeId: z.string().optional(),
})

export const UpdateTicketSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed', 'snoozed', 'spam']).optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  assigneeId: z.string().nullable().optional(),
  snoozedUntil: z.string().datetime().optional(),
})

export const ReplyTicketSchema = z.object({
  body: z.string().min(1),
})

export const AddNoteSchema = z.object({
  body: z.string().min(1),
})

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>
export type ReplyTicketInput = z.infer<typeof ReplyTicketSchema>
export type AddNoteInput = z.infer<typeof AddNoteSchema>
```

- [ ] **Step 9: Write `packages/shared/src/schemas/customer.ts`**

```typescript
import { z } from 'zod'

export const UpsertCustomerSchema = z.object({
  externalId: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  company: z.string().optional(),
})

export type UpsertCustomerInput = z.infer<typeof UpsertCustomerSchema>
```

- [ ] **Step 10: Write `packages/shared/src/schemas/agent.ts`**

```typescript
import { z } from 'zod'

export const UpdateAgentSchema = z.object({
  role: z.enum(['admin', 'agent']),
})

export type UpdateAgentInput = z.infer<typeof UpdateAgentSchema>
```

- [ ] **Step 11: Write `packages/shared/src/index.ts`**

```typescript
export * from './types/ticket'
export * from './types/customer'
export * from './types/agent'
export * from './types/organization'
export * from './schemas/ticket'
export * from './schemas/customer'
export * from './schemas/agent'
```

- [ ] **Step 12: Install shared deps**

```bash
pnpm --filter @sparkdesk/shared install
```

- [ ] **Step 13: Commit**

```bash
git add packages/shared
git commit -m "feat(shared): core TypeScript types and Zod schemas"
```

---

## Task 3: `apps/api` — Hono app with Prisma schema

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/db.ts`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/src/middleware/auth.ts`
- Create: `apps/api/.env.example`

- [ ] **Step 1: Create API app directory**

```bash
mkdir -p apps/api/src/middleware apps/api/src/routes apps/api/prisma
```

- [ ] **Step 2: Write `apps/api/package.json`**

```json
{
  "name": "@sparkdesk/api",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^5.16.0",
    "@sparkdesk/shared": "workspace:*",
    "hono": "^4.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "prisma": "^5.16.0",
    "tsx": "^4.16.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Write `apps/api/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Write `apps/api/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Organization {
  id                   String   @id @default(cuid())
  name                 String
  workosOrganizationId String   @unique
  plan                 Plan     @default(free)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  agents    Agent[]
  customers Customer[]
  tickets   Ticket[]
}

enum Plan {
  free
  pro
  enterprise
}

model Agent {
  id             String      @id @default(cuid())
  name           String
  email          String
  role           AgentRole   @default(agent)
  workosUserId   String      @unique
  organizationId String
  createdAt      DateTime    @default(now())

  organization   Organization @relation(fields: [organizationId], references: [id])
  assignedTickets Ticket[]    @relation("AssignedTickets")
  messages        Message[]
  notes           Note[]
}

enum AgentRole {
  admin
  agent
}

model Customer {
  id             String    @id @default(cuid())
  externalId     String?
  name           String
  email          String
  company        String?
  organizationId String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  tickets        Ticket[]

  @@unique([organizationId, email])
  @@unique([organizationId, externalId])
}

model Ticket {
  id             String        @id @default(cuid())
  subject        String
  status         TicketStatus  @default(open)
  priority       TicketPriority @default(normal)
  channel        TicketChannel @default(web)
  organizationId String
  customerId     String
  assigneeId     String?
  slaDeadline    DateTime?
  snoozedUntil   DateTime?
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  organization   Organization @relation(fields: [organizationId], references: [id])
  customer       Customer     @relation(fields: [customerId], references: [id])
  assignee       Agent?       @relation("AssignedTickets", fields: [assigneeId], references: [id])
  messages       Message[]
  notes          Note[]
}

enum TicketStatus {
  open
  in_progress
  waiting_on_customer
  resolved
  closed
  snoozed
  spam
}

enum TicketPriority {
  urgent
  high
  normal
  low
}

enum TicketChannel {
  web
  api
  slack
  email
}

model Message {
  id         String     @id @default(cuid())
  ticketId   String
  body       String
  authorType MessageAuthorType
  agentId    String?
  createdAt  DateTime   @default(now())

  ticket     Ticket     @relation(fields: [ticketId], references: [id])
  agent      Agent?     @relation(fields: [agentId], references: [id])
}

enum MessageAuthorType {
  customer
  agent
}

model Note {
  id        String   @id @default(cuid())
  ticketId  String
  body      String
  agentId   String
  createdAt DateTime @default(now())

  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  agent     Agent    @relation(fields: [agentId], references: [id])
}
```

- [ ] **Step 5: Write `apps/api/src/db.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

- [ ] **Step 6: Write `apps/api/src/middleware/auth.ts`**

```typescript
import type { Context, Next } from 'hono'

export async function serviceAuthMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.replace('Bearer ', '')

  if (token !== process.env.INTERNAL_API_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  await next()
}
```

- [ ] **Step 7: Write `apps/api/src/index.ts`** (skeleton — routes added in Task 4)

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { ticketRoutes } from './routes/tickets'
import { customerRoutes } from './routes/customers'
import { agentRoutes } from './routes/agents'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env.WEB_APP_URL ?? 'http://localhost:3000' }))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/internal/tickets', ticketRoutes)
app.route('/internal/customers', customerRoutes)
app.route('/internal/agents', agentRoutes)

export default {
  port: process.env.PORT ?? 3001,
  fetch: app.fetch,
}
```

- [ ] **Step 8: Write `apps/api/.env.example`**

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/sparkdesk"
INTERNAL_API_SECRET="dev-secret-change-in-production"
WEB_APP_URL="http://localhost:3000"
PORT=3001
```

- [ ] **Step 9: Install API deps**

```bash
pnpm --filter @sparkdesk/api install
```

- [ ] **Step 10: Push schema to database**

Copy `.env.example` to `.env` and set `DATABASE_URL`, then:

```bash
cd apps/api && pnpm db:push
```

Expected: `All migrations have been applied` or `Your database is now in sync with your Prisma schema`.

- [ ] **Step 11: Commit**

```bash
git add apps/api
git commit -m "feat(api): Hono app scaffold + Prisma schema"
```

---

## Task 4: `apps/api` — ticket, customer, and agent routes

**Files:**
- Create: `apps/api/src/routes/tickets.ts`
- Create: `apps/api/src/routes/customers.ts`
- Create: `apps/api/src/routes/agents.ts`

- [ ] **Step 1: Write `apps/api/src/routes/tickets.ts`**

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import {
  CreateTicketSchema,
  UpdateTicketSchema,
  ReplyTicketSchema,
  AddNoteSchema,
} from '@sparkdesk/shared'

export const ticketRoutes = new Hono()

ticketRoutes.use('*', serviceAuthMiddleware)

// List tickets (filterable by status, priority, assigneeId)
ticketRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { status, priority, assigneeId } = c.req.query()

  const tickets = await db.ticket.findMany({
    where: {
      organizationId: orgId,
      ...(status && { status: status as any }),
      ...(priority && { priority: priority as any }),
      ...(assigneeId && { assigneeId }),
    },
    include: { customer: true, assignee: true },
    orderBy: { updatedAt: 'desc' },
  })

  return c.json(tickets)
})

// Get single ticket with messages and notes
ticketRoutes.get('/:id', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const ticket = await db.ticket.findFirst({
    where: { id: c.req.param('id'), organizationId: orgId },
    include: {
      customer: true,
      assignee: true,
      messages: { orderBy: { createdAt: 'asc' } },
      notes: { include: { agent: true }, orderBy: { createdAt: 'asc' } },
    },
  })

  if (!ticket) return c.json({ error: 'Not found' }, 404)
  return c.json(ticket)
})

// Create ticket
ticketRoutes.post('/', zValidator('json', CreateTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const ticket = await db.ticket.create({
    data: {
      subject: data.subject,
      priority: data.priority,
      channel: data.channel,
      organizationId: orgId,
      customerId: data.customerId,
      assigneeId: data.assigneeId ?? null,
      messages: {
        create: {
          body: data.body,
          authorType: 'customer',
        },
      },
    },
    include: { customer: true, assignee: true },
  })

  return c.json(ticket, 201)
})

// Update ticket (status, priority, assignee)
ticketRoutes.patch('/:id', zValidator('json', UpdateTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const ticket = await db.ticket.updateMany({
    where: { id: c.req.param('id'), organizationId: orgId },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.priority && { priority: data.priority }),
      ...('assigneeId' in data && { assigneeId: data.assigneeId }),
      ...(data.snoozedUntil && { snoozedUntil: new Date(data.snoozedUntil), status: 'snoozed' }),
    },
  })

  if (ticket.count === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})

// Reply to customer
ticketRoutes.post('/:id/reply', zValidator('json', ReplyTicketSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  const agentId = c.req.header('X-Agent-Id')
  if (!orgId || !agentId) return c.json({ error: 'Missing headers' }, 400)

  const { body } = c.req.valid('json')

  const [message] = await db.$transaction([
    db.message.create({
      data: { ticketId: c.req.param('id'), body, authorType: 'agent', agentId },
    }),
    db.ticket.updateMany({
      where: { id: c.req.param('id'), organizationId: orgId },
      data: { status: 'in_progress', updatedAt: new Date() },
    }),
  ])

  return c.json(message, 201)
})

// Add internal note
ticketRoutes.post('/:id/notes', zValidator('json', AddNoteSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  const agentId = c.req.header('X-Agent-Id')
  if (!orgId || !agentId) return c.json({ error: 'Missing headers' }, 400)

  const { body } = c.req.valid('json')

  const note = await db.note.create({
    data: { ticketId: c.req.param('id'), body, agentId },
    include: { agent: true },
  })

  return c.json(note, 201)
})
```

- [ ] **Step 2: Install `@hono/zod-validator`**

```bash
pnpm --filter @sparkdesk/api add @hono/zod-validator
```

- [ ] **Step 3: Write `apps/api/src/routes/customers.ts`**

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import { UpsertCustomerSchema } from '@sparkdesk/shared'

export const customerRoutes = new Hono()

customerRoutes.use('*', serviceAuthMiddleware)

customerRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { q } = c.req.query()

  const customers = await db.customer.findMany({
    where: {
      organizationId: orgId,
      ...(q && {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { company: { contains: q, mode: 'insensitive' } },
        ],
      }),
    },
    orderBy: { createdAt: 'desc' },
  })

  return c.json(customers)
})

customerRoutes.get('/:id/timeline', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const tickets = await db.ticket.findMany({
    where: { customerId: c.req.param('id'), organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    include: { assignee: true },
  })

  return c.json(tickets)
})

customerRoutes.post('/', zValidator('json', UpsertCustomerSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const data = c.req.valid('json')

  const customer = await db.customer.upsert({
    where: { organizationId_email: { organizationId: orgId, email: data.email } },
    create: { ...data, organizationId: orgId },
    update: { name: data.name, company: data.company },
  })

  return c.json(customer, 201)
})
```

- [ ] **Step 4: Write `apps/api/src/routes/agents.ts`**

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { db } from '../db'
import { serviceAuthMiddleware } from '../middleware/auth'
import { UpdateAgentSchema } from '@sparkdesk/shared'

export const agentRoutes = new Hono()

agentRoutes.use('*', serviceAuthMiddleware)

agentRoutes.get('/', async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const agents = await db.agent.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'asc' },
  })

  return c.json(agents)
})

agentRoutes.patch('/:id', zValidator('json', UpdateAgentSchema), async (c) => {
  const orgId = c.req.header('X-Organization-Id')
  if (!orgId) return c.json({ error: 'Missing X-Organization-Id' }, 400)

  const { role } = c.req.valid('json')

  const result = await db.agent.updateMany({
    where: { id: c.req.param('id'), organizationId: orgId },
    data: { role },
  })

  if (result.count === 0) return c.json({ error: 'Not found' }, 404)
  return c.json({ ok: true })
})
```

- [ ] **Step 5: Verify the API starts**

```bash
cd apps/api && cp .env.example .env  # if not done yet
pnpm dev
```

Expected: `Listening on http://localhost:3001` with no TypeScript errors.

- [ ] **Step 6: Smoke test the health endpoint**

```bash
curl http://localhost:3001/health
```

Expected: `{"ok":true}`

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/routes
git commit -m "feat(api): ticket, customer, and agent routes"
```

---

## Task 5: `apps/web` — Next.js 15 scaffold with WorkOS auth

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/components.json`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/auth/login/page.tsx`
- Create: `apps/web/src/app/auth/callback/route.ts`
- Create: `apps/web/src/middleware.ts`
- Create: `apps/web/src/lib/utils.ts`
- Create: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/.env.example`

- [ ] **Step 1: Create web app directories**

```bash
mkdir -p apps/web/src/app/auth/login \
         apps/web/src/app/auth/callback \
         apps/web/src/app/\(app\)/inbox \
         apps/web/src/components/layout \
         apps/web/src/components/tickets \
         apps/web/src/components/ui \
         apps/web/src/lib
```

- [ ] **Step 2: Write `apps/web/package.json`**

```json
{
  "name": "@sparkdesk/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@sparkdesk/shared": "workspace:*",
    "@workos-inc/authkit-nextjs": "^0.13.0",
    "clsx": "^2.1.1",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^2.5.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 3: Write `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write `apps/web/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { typedRoutes: true },
}

export default nextConfig
```

- [ ] **Step 5: Write `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#818CF8',
        bg: {
          DEFAULT: '#09090B',
          panel: '#0E0E11',
          surface: '#131316',
          hover: '#1A1A1F',
          selected: '#16161D',
        },
        border: {
          DEFAULT: '#1F1F27',
          strong: '#2A2A35',
        },
      },
    },
  },
} satisfies Config
```

- [ ] **Step 6: Write `apps/web/.env.example`**

```
WORKOS_CLIENT_ID="client_..."
WORKOS_API_KEY="sk_..."
WORKOS_REDIRECT_URI="http://localhost:3000/auth/callback"
NEXT_PUBLIC_WORKOS_CLIENT_ID="client_..."

INTERNAL_API_URL="http://localhost:3001"
INTERNAL_API_SECRET="dev-secret-change-in-production"
```

- [ ] **Step 7: Write `apps/web/src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 8: Write `apps/web/src/lib/api-client.ts`**

```typescript
const API_URL = process.env.INTERNAL_API_URL ?? 'http://localhost:3001'
const API_SECRET = process.env.INTERNAL_API_SECRET ?? ''

interface RequestOptions {
  organizationId: string
  agentId?: string
  method?: string
  body?: unknown
}

async function apiRequest<T>(path: string, options: RequestOptions): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_SECRET}`,
      'X-Organization-Id': options.organizationId,
      ...(options.agentId && { 'X-Agent-Id': options.agentId }),
    },
    ...(options.body && { body: JSON.stringify(options.body) }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error((error as any).error ?? `API error ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const apiClient = {
  tickets: {
    list: (orgId: string, params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return apiRequest<any[]>(`/internal/tickets${qs}`, { organizationId: orgId })
    },
    get: (orgId: string, id: string) =>
      apiRequest<any>(`/internal/tickets/${id}`, { organizationId: orgId }),
    create: (orgId: string, body: unknown) =>
      apiRequest<any>('/internal/tickets', { organizationId: orgId, method: 'POST', body }),
    update: (orgId: string, id: string, body: unknown) =>
      apiRequest<any>(`/internal/tickets/${id}`, { organizationId: orgId, method: 'PATCH', body }),
    reply: (orgId: string, agentId: string, id: string, body: unknown) =>
      apiRequest<any>(`/internal/tickets/${id}/reply`, { organizationId: orgId, agentId, method: 'POST', body }),
    addNote: (orgId: string, agentId: string, id: string, body: unknown) =>
      apiRequest<any>(`/internal/tickets/${id}/notes`, { organizationId: orgId, agentId, method: 'POST', body }),
  },
  customers: {
    list: (orgId: string, q?: string) =>
      apiRequest<any[]>(`/internal/customers${q ? `?q=${q}` : ''}`, { organizationId: orgId }),
    timeline: (orgId: string, id: string) =>
      apiRequest<any[]>(`/internal/customers/${id}/timeline`, { organizationId: orgId }),
  },
  agents: {
    list: (orgId: string) =>
      apiRequest<any[]>('/internal/agents', { organizationId: orgId }),
  },
}
```

- [ ] **Step 9: Write `apps/web/src/middleware.ts`**

WorkOS AuthKit provides a `withAuth` middleware. Reference their docs at https://workos.com/docs/user-management/nextjs for the exact import path for your SDK version. The pattern is:

```typescript
import { authkitMiddleware } from '@workos-inc/authkit-nextjs'

export default authkitMiddleware()

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth).*)'],
}
```

- [ ] **Step 10: Write `apps/web/src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SparkDesk',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

Create `apps/web/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --accent:        #818CF8;
  --accent-dim:    #818CF814;
  --accent-border: #818CF830;
  --bg:            #09090B;
  --bg-panel:      #0E0E11;
  --bg-surface:    #131316;
  --bg-hover:      #1A1A1F;
  --bg-selected:   #16161D;
  --border:        #1F1F27;
  --border-strong: #2A2A35;
  --text-primary:  #FAFAFA;
  --text-secondary:#A1A1AA;
  --text-muted:    #52525B;
  --urgent:        #F87171;
  --waiting:       #FBBF24;
  --resolved:      #34D399;
}

body { background: var(--bg); color: var(--text-primary); }
```

- [ ] **Step 11: Write login page and auth callback**

`apps/web/src/app/auth/login/page.tsx` — WorkOS AuthKit provides a `SignIn` component. Check their docs for the current component name. The minimal pattern:

```typescript
import { getSignInUrl } from '@workos-inc/authkit-nextjs'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
  const url = await getSignInUrl()
  redirect(url)
}
```

`apps/web/src/app/auth/callback/route.ts`:

```typescript
import { handleAuth } from '@workos-inc/authkit-nextjs'

export const GET = handleAuth()
```

- [ ] **Step 12: Write `apps/web/src/app/page.tsx`**

```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/inbox')
}
```

- [ ] **Step 13: Install web deps**

```bash
pnpm --filter @sparkdesk/web install
```

- [ ] **Step 14: Copy `.env.example` to `.env.local` and fill in WorkOS credentials**

In the WorkOS dashboard:
1. Create an application
2. Set redirect URI to `http://localhost:3000/auth/callback`
3. Copy `Client ID` → `WORKOS_CLIENT_ID` and `NEXT_PUBLIC_WORKOS_CLIENT_ID`
4. Copy API key → `WORKOS_API_KEY`

- [ ] **Step 15: Verify the web app starts**

```bash
pnpm --filter @sparkdesk/web dev
```

Expected: Next.js starts on port 3000. Visiting `http://localhost:3000` redirects to WorkOS login.

- [ ] **Step 16: Commit**

```bash
git add apps/web
git commit -m "feat(web): Next.js 15 scaffold with WorkOS auth"
```

---

## Task 6: `apps/web` — shadcn/ui setup

**Files:**
- Create: `apps/web/components.json`
- Modify: `apps/web/src/app/globals.css`

shadcn/ui provides unstyled, accessible component primitives that we theme entirely via CSS variables. We install only the components we actually use: `Button`, `Textarea`, and `Separator`.

- [ ] **Step 1: Initialise shadcn**

```bash
cd apps/web && npx shadcn@latest init
```

When prompted:
- Style: **Default**
- Base color: **Slate** (we'll override everything with our palette anyway)
- CSS variables: **yes**

This generates `components.json` and updates `globals.css` with shadcn's variable scaffold.

- [ ] **Step 2: Add the components we need**

```bash
npx shadcn@latest add button textarea separator
```

Expected: creates `src/components/ui/button.tsx`, `textarea.tsx`, `separator.tsx`.

- [ ] **Step 3: Override `globals.css` with the SparkDesk Indigo palette**

Replace the generated `:root` and `.dark` blocks with our palette mapped to shadcn's variable names. shadcn expects HSL values (numbers only, no `hsl()` wrapper):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* ============================================================
   THEME — edit these variables to restyle the entire app.
   shadcn reads the variables below; our custom properties
   (--bg-panel, --text-muted, etc.) extend the system.
   ============================================================ */
:root {
  /* shadcn core */
  --background:          240 6% 4%;      /* #09090B */
  --foreground:          0 0% 98%;       /* #FAFAFA */
  --card:                240 8% 6%;      /* #0E0E11 */
  --card-foreground:     0 0% 98%;
  --popover:             240 8% 6%;
  --popover-foreground:  0 0% 98%;
  --primary:             234 89% 74%;    /* #818CF8 */
  --primary-foreground:  240 6% 4%;
  --secondary:           240 7% 9%;      /* #131316 */
  --secondary-foreground:0 0% 98%;
  --muted:               240 7% 9%;
  --muted-foreground:    240 4% 65%;     /* #A1A1AA */
  --accent:              240 7% 11%;     /* #1A1A1F — hover bg */
  --accent-foreground:   0 0% 98%;
  --destructive:         0 91% 71%;      /* #F87171 */
  --destructive-foreground: 0 0% 98%;
  --border:              240 10% 14%;    /* #1F1F27 */
  --input:               240 10% 14%;
  --ring:                234 89% 74%;
  --radius:              0.375rem;

  /* SparkDesk extended palette */
  --bg-panel:      #0E0E11;
  --bg-surface:    #131316;
  --bg-hover:      #1A1A1F;
  --bg-selected:   #16161D;
  --border-strong: #2A2A35;
  --text-primary:  #FAFAFA;
  --text-secondary:#A1A1AA;
  --text-muted:    #52525B;
  --urgent:        #F87171;
  --waiting:       #FBBF24;
  --resolved:      #34D399;
  --accent-color:  #818CF8;   /* our brand accent, avoids clash with shadcn --accent */
  --accent-dim:    #818CF814;
  --accent-border: #818CF830;
}
/* ============================================================ */

* { border-color: hsl(var(--border)); }
body { background: hsl(var(--background)); color: hsl(var(--foreground)); -webkit-font-smoothing: antialiased; }
```

- [ ] **Step 4: Verify shadcn Button renders**

In any page, temporarily import and render `<Button>Test</Button>` from `@/components/ui/button`. It should appear with the indigo accent color. Remove it after confirming.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components.json apps/web/src/app/globals.css apps/web/src/components/ui
git commit -m "feat(web): shadcn/ui setup with indigo palette"
```

---

## Task 7: `apps/web` — App shell (sidebar + layout)

**Files:**
- Create: `apps/web/src/components/layout/sidebar.tsx`
- Create: `apps/web/src/components/layout/shell.tsx`
- Create: `apps/web/src/app/(app)/layout.tsx`

- [ ] **Step 1: Write `apps/web/src/components/layout/sidebar.tsx`**

```typescript
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Inbox', href: '/inbox', badge: true },
  { label: 'All tickets', href: '/tickets' },
  { label: 'Mine', href: '/tickets?assignee=me' },
  null, // divider
  { label: 'Customers', href: '/customers' },
  { label: 'Team', href: '/team' },
  { label: 'Integrations', href: '/integrations' },
  null,
  { label: 'Reports', href: '/reports' },
  { label: 'Settings', href: '/settings' },
]

interface SidebarProps {
  agentName: string
  agentInitials: string
}

export function Sidebar({ agentName, agentInitials }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col border-r"
      style={{ width: 208, background: 'var(--bg-panel)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5">
        <div className="w-5 h-5 rounded-[4px]" style={{ background: 'var(--accent)' }} />
        <span className="text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          SparkDesk
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-1.5 space-y-px">
        {navItems.map((item, i) =>
          item === null ? (
            <Separator key={i} className="my-2 opacity-50" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center justify-between rounded px-2.5 py-[5px] text-[13px] transition-colors',
                pathname === item.href
                  ? 'font-medium'
                  : 'font-[450]'
              )}
              style={{
                color: pathname === item.href ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: pathname === item.href ? 'var(--bg-hover)' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* Agent row */}
      <div className="px-2 pb-3.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        <div
          className="flex items-center gap-2.5 rounded px-2.5 py-1.5 cursor-pointer transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
          >
            {agentInitials}
          </div>
          <span className="text-[12.5px]">{agentName}</span>
          <div className="w-1.5 h-1.5 rounded-full ml-auto" style={{ background: 'var(--resolved)' }} />
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Write `apps/web/src/components/layout/shell.tsx`**

```typescript
import { Sidebar } from './sidebar'

interface ShellProps {
  children: React.ReactNode
  agentName: string
  agentInitials: string
}

export function Shell({ children, agentName, agentInitials }: ShellProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar agentName={agentName} agentInitials={agentInitials} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Write `apps/web/src/app/(app)/layout.tsx`**

WorkOS AuthKit provides `getUser` (or similar — check their docs for the current function name). The pattern:

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs'
import { Shell } from '@/components/layout/shell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = await withAuth({ ensureSignedIn: true })

  const name = user.firstName && user.lastName
    ? `${user.firstName} ${user.lastName}`
    : user.email ?? 'Agent'

  const initials = name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <Shell agentName={name} agentInitials={initials}>
      {children}
    </Shell>
  )
}
```

- [ ] **Step 4: Verify layout renders**

Visit `http://localhost:3000/inbox` after logging in. Expected: sidebar visible with nav items, main area empty (no inbox page yet).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/layout apps/web/src/app/\(app\)/layout.tsx
git commit -m "feat(web): app shell and sidebar"
```

---

## Task 8: `apps/web` — Ticket inbox page

**Files:**
- Create: `apps/web/src/components/tickets/ticket-item.tsx`
- Create: `apps/web/src/components/tickets/ticket-list.tsx`
- Create: `apps/web/src/components/tickets/status-badge.tsx`
- Create: `apps/web/src/app/(app)/inbox/page.tsx`

- [ ] **Step 1: Write `apps/web/src/components/tickets/status-badge.tsx`**

```typescript
import { cn } from '@/lib/utils'
import type { TicketStatus, TicketPriority } from '@sparkdesk/shared'

interface StatusBadgeProps {
  status?: TicketStatus
  priority?: TicketPriority
  className?: string
}

const statusColors: Record<TicketStatus, string> = {
  open: 'var(--accent)',
  in_progress: 'var(--accent)',
  waiting_on_customer: 'var(--waiting)',
  resolved: 'var(--resolved)',
  closed: 'var(--text-muted)',
  snoozed: 'var(--text-muted)',
  spam: 'var(--text-muted)',
}

const statusLabels: Record<TicketStatus, string> = {
  open: 'Open',
  in_progress: 'In progress',
  waiting_on_customer: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
  snoozed: 'Snoozed',
  spam: 'Spam',
}

const priorityColors: Record<TicketPriority, string> = {
  urgent: 'var(--urgent)',
  high: 'var(--waiting)',
  normal: 'var(--border-strong)',
  low: 'var(--border-strong)',
}

export function StatusTag({ status }: { status: TicketStatus }) {
  return (
    <span className="text-[11px] font-medium flex-shrink-0" style={{ color: statusColors[status] }}>
      {statusLabels[status]}
    </span>
  )
}

export function PriorityDot({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className="w-[5px] h-[5px] rounded-full flex-shrink-0 inline-block"
      style={{ background: priorityColors[priority] }}
    />
  )
}
```

- [ ] **Step 2: Write `apps/web/src/components/tickets/ticket-item.tsx`**

```typescript
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { StatusTag, PriorityDot } from './status-badge'
import type { Ticket, Customer } from '@sparkdesk/shared'

interface TicketItemProps {
  ticket: Ticket & { customer: Customer }
  selected?: boolean
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

export function TicketItem({ ticket, selected }: TicketItemProps) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block px-4 py-[11px] border-b relative cursor-pointer transition-colors"
      style={{
        borderColor: 'var(--border)',
        background: selected ? 'var(--bg-selected)' : 'transparent',
      }}
    >
      {selected && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[2px]"
          style={{ background: 'var(--accent)' }}
        />
      )}
      <div className="flex items-center justify-between gap-2 mb-[3px]">
        <span
          className="text-[13px] font-[560] truncate"
          style={{ color: 'var(--text-primary)' }}
        >
          {ticket.subject}
        </span>
        <span className="text-[11px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
          {timeAgo(ticket.updatedAt)}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <PriorityDot priority={ticket.priority} />
        <span
          className="text-[12px] truncate flex-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {ticket.customer.name}
        </span>
        <StatusTag status={ticket.status} />
      </div>
    </Link>
  )
}
```

- [ ] **Step 3: Write `apps/web/src/components/tickets/ticket-list.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { TicketItem } from './ticket-item'
import type { Ticket, Customer, TicketStatus } from '@sparkdesk/shared'

type TicketWithCustomer = Ticket & { customer: Customer }

const filters: { label: string; value: TicketStatus | 'all' }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Waiting', value: 'waiting_on_customer' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'All', value: 'all' },
]

interface TicketListProps {
  tickets: TicketWithCustomer[]
  selectedId?: string
}

export function TicketList({ tickets, selectedId }: TicketListProps) {
  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'all'>('open')

  const filtered =
    activeFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === activeFilter)

  return (
    <div
      className="flex flex-col border-r overflow-hidden"
      style={{ width: 320, borderColor: 'var(--border)', background: 'var(--bg)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <span className="text-[13.5px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Inbox
        </span>
        <Button size="sm">New ticket</Button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1 px-4 pb-3">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActiveFilter(f.value)}
            className="px-2.5 py-[3px] rounded text-[12px] font-medium transition-colors border-none"
            style={{
              background: activeFilter === f.value ? 'var(--bg-surface)' : 'transparent',
              color: activeFilter === f.value ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-[13px]" style={{ color: 'var(--text-muted)' }}>
            No tickets
          </p>
        ) : (
          filtered.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} selected={ticket.id === selectedId} />
          ))
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write `apps/web/src/app/(app)/inbox/page.tsx`**

This page requires the WorkOS session to get the user's `organizationId`. For now, use a hardcoded org ID from your seeded data (Task 9 will seed demo data). Replace `YOUR_ORG_ID` with the actual cuid from the database after seeding.

```typescript
import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from '@/lib/api-client'
import { TicketList } from '@/components/tickets/ticket-list'

// TODO: derive orgId from WorkOS session once agent provisioning is wired (Task 8)
const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''

export default async function InboxPage() {
  await withAuth({ ensureSignedIn: true })

  const tickets = await apiClient.tickets.list(DEMO_ORG_ID)

  return (
    <div className="flex h-full">
      <TicketList tickets={tickets} />
      <div
        className="flex-1 flex items-center justify-center"
        style={{ color: 'var(--text-muted)' }}
      >
        <p className="text-sm">Select a ticket</p>
      </div>
    </div>
  )
}
```

Add `DEMO_ORG_ID=` to `apps/web/.env.example` and `.env.local`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/tickets apps/web/src/app/\(app\)/inbox
git commit -m "feat(web): ticket inbox — list with filter tabs"
```

---

## Task 9: `apps/web` — Ticket detail page

**Files:**
- Create: `apps/web/src/components/tickets/ticket-thread.tsx`
- Create: `apps/web/src/components/tickets/reply-box.tsx`
- Create: `apps/web/src/components/tickets/ticket-detail.tsx`
- Create: `apps/web/src/app/(app)/tickets/[id]/page.tsx`

- [ ] **Step 1: Write `apps/web/src/components/tickets/ticket-thread.tsx`**

```typescript
import type { TicketMessage, TicketNote } from '@sparkdesk/shared'

interface ThreadItem {
  type: 'message' | 'note'
  id: string
  body: string
  authorType?: 'customer' | 'agent'
  authorName?: string
  createdAt: string
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(name?: string) {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0] ?? '').join('').toUpperCase().slice(0, 2)
}

export function TicketThread({ items }: { items: ThreadItem[] }) {
  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-[18px]">
      {items.map((item) => {
        if (item.type === 'note') {
          return (
            <div
              key={item.id}
              className="flex gap-2.5 items-start rounded-lg px-3.5 py-2.5 text-[12.5px] leading-relaxed"
              style={{
                background: '#FBBF2408',
                border: '1px solid #FBBF2420',
                color: '#FBBF24',
              }}
            >
              <span className="text-[10.5px] font-semibold uppercase tracking-wider opacity-60 mt-px flex-shrink-0">
                Note
              </span>
              <span>{item.body}</span>
            </div>
          )
        }

        const isAgent = item.authorType === 'agent'
        return (
          <div key={item.id} className={`flex gap-2.5 items-start ${isAgent ? 'flex-row-reverse' : ''}`}>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={
                isAgent
                  ? { background: 'var(--accent-dim)', color: 'var(--accent)' }
                  : { background: 'var(--bg-surface)', color: 'var(--text-muted)' }
              }
            >
              {initials(item.authorName)}
            </div>
            <div className={`max-w-[76%] ${isAgent ? 'items-end' : 'items-start'} flex flex-col`}>
              <div
                className="px-3.5 py-2.5 rounded-lg text-[13px] leading-relaxed"
                style={
                  isAgent
                    ? {
                        background: 'var(--accent-dim)',
                        border: '1px solid var(--accent-border)',
                        color: 'var(--text-primary)',
                        borderRadius: '8px 2px 8px 8px',
                      }
                    : {
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        borderRadius: '2px 8px 8px 8px',
                      }
                }
              >
                {item.body}
              </div>
              <span className="text-[11px] mt-1.5 px-0.5" style={{ color: 'var(--text-muted)' }}>
                {timeLabel(item.createdAt)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function buildThreadItems(
  messages: TicketMessage[],
  notes: (TicketNote & { agent?: { name: string } })[],
  customerName: string,
  agentNames: Record<string, string>
): ThreadItem[] {
  const items: ThreadItem[] = [
    ...messages.map((m) => ({
      type: 'message' as const,
      id: m.id,
      body: m.body,
      authorType: m.authorType,
      authorName: m.authorType === 'customer' ? customerName : (agentNames[m.authorId] ?? 'Agent'),
      createdAt: m.createdAt,
    })),
    ...notes.map((n) => ({
      type: 'note' as const,
      id: n.id,
      body: n.body,
      authorName: n.agent?.name ?? 'Agent',
      createdAt: n.createdAt,
    })),
  ]
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}
```

- [ ] **Step 2: Write `apps/web/src/components/tickets/reply-box.tsx`**

```typescript
'use client'
import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ReplyBoxProps {
  onReply: (body: string) => Promise<void>
  onNote: (body: string) => Promise<void>
}

export function ReplyBox({ onReply, onNote }: ReplyBoxProps) {
  const [tab, setTab] = useState<'reply' | 'note'>('reply')
  const [body, setBody] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = () => {
    if (!body.trim()) return
    startTransition(async () => {
      if (tab === 'reply') await onReply(body)
      else await onNote(body)
      setBody('')
    })
  }

  return (
    <div className="px-6 py-3.5" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Tabs */}
      <div className="flex gap-0 mb-2.5" style={{ borderBottom: '1px solid var(--border)' }}>
        {(['reply', 'note'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3 py-[5px] text-[12px] font-medium capitalize"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              marginBottom: -1,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderBottomStyle: 'solid',
              borderBottomWidth: 2,
              borderBottomColor: tab === t ? 'var(--accent)' : 'transparent',
            }}
          >
            {t === 'reply' ? 'Reply' : 'Internal note'}
          </button>
        ))}
      </div>

      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={tab === 'reply' ? 'Reply to customer…' : 'Add an internal note…'}
        rows={3}
        className="resize-none text-[13px] leading-relaxed"
      />

      <div className="flex justify-end gap-2 mt-2.5">
        <Button variant="outline" size="sm" onClick={() => setBody('')}>
          Discard
        </Button>
        <Button size="sm" disabled={!body.trim() || isPending} onClick={handleSubmit}>
          {tab === 'reply' ? 'Send reply' : 'Add note'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write `apps/web/src/app/(app)/tickets/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { withAuth } from '@workos-inc/authkit-nextjs'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import { TicketList } from '@/components/tickets/ticket-list'
import { TicketThread, buildThreadItems } from '@/components/tickets/ticket-thread'
import { ReplyBox } from '@/components/tickets/reply-box'
import { StatusTag, PriorityDot } from '@/components/tickets/status-badge'

const DEMO_ORG_ID = process.env.DEMO_ORG_ID ?? ''
const DEMO_AGENT_ID = process.env.DEMO_AGENT_ID ?? ''

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await withAuth({ ensureSignedIn: true })

  const [tickets, ticket] = await Promise.all([
    apiClient.tickets.list(DEMO_ORG_ID),
    apiClient.tickets.get(DEMO_ORG_ID, id),
  ])

  if (!ticket) notFound()

  const agentNames = Object.fromEntries(
    (ticket.messages ?? [])
      .filter((m: any) => m.authorType === 'agent' && m.agent)
      .map((m: any) => [m.authorId, m.agent.name])
  )

  const threadItems = buildThreadItems(
    ticket.messages ?? [],
    ticket.notes ?? [],
    ticket.customer.name,
    agentNames
  )

  async function handleReply(body: string) {
    'use server'
    await apiClient.tickets.reply(DEMO_ORG_ID, DEMO_AGENT_ID, id, { body })
  }

  async function handleNote(body: string) {
    'use server'
    await apiClient.tickets.addNote(DEMO_ORG_ID, DEMO_AGENT_ID, id, { body })
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
              <PriorityDot priority={ticket.priority} />
              <StatusTag status={ticket.status} />
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{ticket.customer.company ?? ticket.customer.name}</span>
              <span style={{ color: 'var(--border-strong)' }}>·</span>
              <span>{ticket.customer.name}</span>
            </div>
          </div>
          <div className="flex gap-1.5 pt-0.5">
            <Button variant="outline" size="sm">Assign</Button>
            <Button variant="outline" size="sm">Snooze</Button>
            <Button size="sm">Resolve</Button>
          </div>
        </div>

        <TicketThread items={threadItems} />
        <ReplyBox onReply={handleReply} onNote={handleNote} />
      </div>
    </div>
  )
}
```

Add `DEMO_AGENT_ID=` to `.env.example` and `.env.local`.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/tickets/ticket-thread.tsx \
        apps/web/src/components/tickets/reply-box.tsx \
        apps/web/src/app/\(app\)/tickets
git commit -m "feat(web): ticket detail — thread, reply, internal note"
```

---

## Task 10: Seed demo data

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Write `apps/api/prisma/seed.ts`**

```typescript
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
  const t1 = await db.ticket.create({
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
```

- [ ] **Step 2: Add seed script to `apps/api/package.json`**

Add under `"scripts"`:

```json
"db:seed": "tsx prisma/seed.ts"
```

- [ ] **Step 3: Run the seed**

```bash
cd apps/api && pnpm db:seed
```

Expected output:
```
Org: <cuid>
Agent: <cuid>
Seeded successfully.
DEMO_ORG_ID=<cuid>
DEMO_AGENT_ID=<cuid>
```

- [ ] **Step 4: Copy the printed IDs into `apps/web/.env.local`**

```
DEMO_ORG_ID=<cuid from output>
DEMO_AGENT_ID=<cuid from output>
```

- [ ] **Step 5: Verify the full flow**

1. Start API: `pnpm --filter @sparkdesk/api dev`
2. Start web: `pnpm --filter @sparkdesk/web dev`
3. Visit `http://localhost:3000` — redirects to WorkOS login
4. Log in
5. Inbox shows 5 seeded tickets
6. Click "Can't export billing data" — detail view shows thread with 3 messages and 1 internal note
7. Type a reply and click "Send reply" — message appears in thread

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/seed.ts apps/api/package.json
git commit -m "chore(api): seed demo data — org, agent, customers, tickets"
```

---

## Done

Phase 1 delivers a working SparkDesk instance:
- Monorepo with Turborepo + pnpm
- `packages/shared` — all core types and Zod schemas
- `apps/api` — Hono REST API with full ticket CRUD, Prisma + PostgreSQL
- `apps/web` — Next.js 15 dashboard with WorkOS auth, ticket inbox, ticket detail with threaded replies and internal notes
- Seeded demo data ready for a sales call

**Next: Phase 2 — `packages/analytics` + distributed event tracking**
