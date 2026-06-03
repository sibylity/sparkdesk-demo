# SparkDesk — Design Spec

**Date:** 2026-06-03  
**Status:** Approved  
**Purpose:** Demo environment for Voltage Docs AI sales calls. SparkDesk is a fictional B2B SaaS help desk platform modeled after Plain, used to showcase how Voltage surfaces things that are defined in code but invisible to the rest of the team — event taxonomy, product surface documentation, and GTM alignment.

---

## Goals

SparkDesk exists to demonstrate the documentation problems Voltage solves — things that are *defined in code but invisible to the rest of the team*, and hard to assemble in one place without tooling.

1. **Event taxonomy** — a complete, always-current picture of every event, user property, and team property fired across the codebase. In real teams, these are scattered across packages and undocumented. Voltage surfaces them automatically.

2. **Product surface documentation** — feature flags, toggleable features, feature tips, and email templates all live in code but are invisible to product, marketing, and support teams. Voltage makes them discoverable without digging through the repo.

3. **GTM alignment** — pricing plans and plan features are defined in code but disconnected from what sales and marketing actually need to communicate. Voltage bridges the gap between implementation and go-to-market understanding.

The demo should feel like a real customer's codebase, not a Voltage-branded toy app.

---

## Repo Name

`sparkdesk-demo`

---

## Monorepo Structure

```
sparkdesk-demo/
├── apps/
│   ├── web/          Next.js 15 — agent dashboard
│   ├── api/          Hono — REST API + webhooks
│   └── slack/        Slack Bolt SDK — bidirectional Slack integration
└── packages/
    ├── analytics/    PostHog client + shared user/team/event property schemas
    ├── email/        React Email — transactional email templates
    └── shared/       Zod schemas + TypeScript types shared across all apps
```

**Toolchain:**
- Turborepo + pnpm workspaces
- TypeScript throughout
- Prisma + PostgreSQL
- WorkOS AuthKit + Organizations (multi-tenancy)

---

## Design System

**Component library:** shadcn/ui (Tailwind + Radix primitives)

**Style:** Minimalist dark theme. No icon-heavy navigation — clean text labels, subtle borders, generous whitespace.

**Palette — Electric Indigo:**

All colors defined as CSS custom properties in a single theme block, making global retheming a one-file change.

| Variable | Value | Usage |
|---|---|---|
| `--accent` | `#818CF8` | Primary interactive (buttons, active states, links) |
| `--accent-dim` | `#818CF814` | Subtle accent backgrounds |
| `--accent-border` | `#818CF830` | Accent-tinted borders |
| `--bg` | `#09090B` | App background |
| `--bg-panel` | `#0E0E11` | Sidebar, elevated panels |
| `--bg-surface` | `#131316` | Cards, inputs |
| `--bg-hover` | `#1A1A1F` | Hover states |
| `--bg-selected` | `#16161D` | Selected rows |
| `--border` | `#1F1F27` | Default separators |
| `--border-strong` | `#2A2A35` | More visible dividers |
| `--text-primary` | `#FAFAFA` | Primary text |
| `--text-secondary` | `#A1A1AA` | Secondary / label text |
| `--text-muted` | `#52525B` | Timestamps, hints |
| `--color-urgent` | `#F87171` | Urgent priority |
| `--color-waiting` | `#FBBF24` | Waiting on customer |
| `--color-resolved` | `#34D399` | Resolved / success |

**Reference:** `design-preview.html` in repo root — full working UI mockup.

---

## Authentication & Multi-Tenancy

- **WorkOS AuthKit** for agent/admin login
- **WorkOS Organizations** for multi-tenancy — each SparkDesk customer is an Organization; all queries are scoped by `orgId`
- Roles: `admin`, `agent`
- No SSO, Directory Sync, or Admin Portal in scope for this demo

---

## `apps/web` — Agent Dashboard

### Pages & Features

- **Ticket inbox** — filterable by status, priority, assignee, label
- **Ticket detail** — conversation thread, internal notes, assignment controls, snooze, merge, label management, customer timeline panel
- **Customer profile** — lightweight identity (name, email, external ID, optional company) + full conversation history
- **Team management** — list agents, assign roles (admin / agent)
- **Reporting dashboard** — lightweight: ticket volume over time, open tickets by agent, average resolution time

### Ticket Lifecycle

States: `open` → `in_progress` → `waiting_on_customer` → `resolved` → `closed`  
Additional states: `snoozed`, `spam`

Actions: create, assign, reply (to customer), add internal note, snooze, resolve, reopen, merge, label

Attributes: priority (`urgent` / `high` / `normal` / `low`), assignee, labels, source channel, SLA due date

### Customer Model (Plain-style)

Lightweight. No CRM features.

Fields: `id`, `externalId`, `name`, `email`, `company` (optional), `createdAt`  
Customer timeline: full list of tickets/conversations across all time

---

## `apps/api` — Hono REST API

Two distinct API surfaces, both crawlable by Voltage for documentation.

### Internal API

Consumed by `apps/web` and `apps/slack`. Auth via shared service token (not publicly exposed). Full operational surface — every action the product needs.

**Tickets**
- `POST /internal/tickets` — create ticket
- `GET /internal/tickets` — list tickets (filterable)
- `GET /internal/tickets/:id` — fetch ticket detail
- `PATCH /internal/tickets/:id` — update ticket (status, priority, assignee, labels)
- `POST /internal/tickets/:id/reply` — send reply to customer
- `POST /internal/tickets/:id/notes` — add internal note
- `POST /internal/tickets/:id/merge` — merge into another ticket
- `POST /internal/tickets/:id/snooze` — snooze ticket

**Customers**
- `GET /internal/customers` — list/search customers
- `POST /internal/customers` — upsert customer
- `GET /internal/customers/:id/timeline` — full conversation history

**Agents & Teams**
- `GET /internal/agents` — list agents in org
- `PATCH /internal/agents/:id` — update agent role

**Slack**
- `POST /internal/slack/connect` — store OAuth tokens for a workspace connection
- `POST /internal/slack/send` — deliver message to customer Slack channel

### Public API (`/v1/`)

Externally accessible. Auth via API key (header: `Authorization: Bearer <key>`) or OAuth client credentials. Versioned. A subset of the internal surface — the integration-facing operations customers need.

**Tickets**
- `POST /v1/tickets` — create ticket from external system
- `GET /v1/tickets/:id` — fetch ticket status
- `PATCH /v1/tickets/:id` — update ticket status or priority
- `POST /v1/tickets/:id/reply` — send reply

**Customers**
- `POST /v1/customers` — upsert customer by external ID
- `GET /v1/customers/:id/timeline` — fetch conversation history

**Webhooks**
- `POST /v1/webhooks` — register a webhook endpoint
- `DELETE /v1/webhooks/:id` — deregister
- `GET /v1/webhooks/events` — webhook event catalog (machine-readable)

### Webhook Events Dispatched

`ticket.created`, `ticket.assigned`, `ticket.status_changed`, `ticket.replied`, `ticket.resolved`

---

## `apps/slack` — Slack Integration

### Flows

- **Inbound:** Customer sends message in shared Slack channel → creates or updates SparkDesk ticket
- **Outbound:** Agent replies in SparkDesk web app → message delivered to customer's Slack channel
- **Bidirectional:** Agent replies in Slack → synced back to SparkDesk ticket thread
- **Slash command:** `/sparkdesk assign @agent` for quick ticket assignment from Slack

### Connection

SparkDesk workspaces connect their Slack via OAuth. Each connected Slack workspace is scoped to one SparkDesk Organization.

---

## `packages/analytics` — Event Library

### What it owns

- **PostHog client wrapper** — initialized once, exported for all apps to import
- **Shared property schemas** — user properties, team/workspace properties, base event properties (exact property names TBD)

### What it does NOT own

Event definitions. Each app defines its own events co-located with the code that fires them, importing shared property types from this package.

```
apps/api/src/analytics/events.ts      → API-layer events
apps/web/src/analytics/events.ts      → Dashboard/UI events  
apps/slack/src/analytics/events.ts    → Slack integration events
```

Each event extends the shared property schemas from `packages/analytics` so all events carry consistent user and team context.

**Voltage crawls all three apps** to discover, correlate, and document the full event taxonomy — demonstrating the crawl-and-discover use case across a distributed codebase.

---

## `packages/email` — Transactional Email Templates

Built with React Email. Templates are co-located with their trigger context but rendered and sent via this package.

**Templates:**
- `TicketCreated` — confirmation to customer when a ticket is opened
- `TicketReplied` — notification to customer when an agent replies
- `TicketResolved` — resolution confirmation to customer
- `AgentAssigned` — notification to agent when a ticket is assigned to them
- `SlaBreachWarning` — alert to agent when a ticket is approaching SLA deadline
- `WeeklyDigest` — weekly summary of ticket volume and resolution stats for admins

Sent via **Resend**. Provider is swappable — only the send adapter changes, not the templates.

---

## GTM

### Plans

SparkDesk has three pricing tiers defined in `packages/shared`:

| Plan | Description |
|---|---|
| `free` | Single agent, limited ticket volume, no integrations |
| `pro` | Multiple agents, Slack integration, webhooks, public API access |
| `enterprise` | Unlimited agents, SSO-ready, advanced reporting, priority support |

### Plan Features

Feature gates are enforced in `apps/api` middleware and checked in `apps/web` UI. Each gated feature maps to a plan requirement:

| Feature | Minimum Plan |
|---|---|
| Slack integration | `pro` |
| Public API access | `pro` |
| Webhook registration | `pro` |
| Advanced reporting | `pro` |
| Multiple agents | `pro` |
| SSO-ready auth | `enterprise` |
| Custom SLA rules | `enterprise` |

---

## Product

### Toggleable Features

Org-level feature toggles stored in the database, configurable by admins from the Team Settings page. Each toggle enables or disables a specific capability for the entire workspace.

**Toggles:**
- `slack_integration_enabled` — enable/disable Slack channel support
- `public_api_enabled` — enable/disable public API access
- `webhook_notifications_enabled` — enable/disable outbound webhooks
- `email_notifications_enabled` — enable/disable transactional emails
- `sla_enforcement_enabled` — enable/disable SLA deadline tracking

### Feature Flags

Managed via **LaunchDarkly** (free Developer tier). Flag evaluation happens server-side in `apps/api` and `apps/web` via the LaunchDarkly Node.js and React SDKs. Flag keys are defined as typed constants to keep references consistent across the codebase — Voltage can crawl these to document every flag, its purpose, and where it's evaluated.

**Examples:**
- `new-ticket-inbox-ui` — gradual rollout of redesigned inbox
- `ai-reply-suggestions` — experimental AI-drafted reply suggestions
- `bulk-ticket-actions` — batch assign/resolve from inbox

### Feature Tips

In-app onboarding hints shown to agents on first use of key features. Dismissable per user, stored in the database. Voltage documents what each tip explains and where it fires.

**Tips:**
- `inbox_filters_tip` — explains filter controls on first inbox visit
- `slack_connect_tip` — prompts Slack connection setup if not configured
- `internal_notes_tip` — explains internal notes vs. customer replies on first ticket detail view
- `sla_badge_tip` — explains the SLA countdown badge on first appearance

---

## `packages/shared` — Shared Types

Zod schemas and TypeScript types for core domain objects shared across all apps:

- `Ticket` — full ticket shape including status, priority, assignee, labels, channel
- `Customer` — lightweight customer identity
- `Agent` — user within a SparkDesk organization
- `Organization` — WorkOS org wrapper with SparkDesk-specific settings
- `WebhookEvent` — base webhook payload shape

---

## Voltage Docs Use Case Mapping

| Voltage Category | Use Case | Where it lives in SparkDesk | Why it's hard without Voltage |
|---|---|---|---|
| Analytics | Event taxonomy (crawl) | Distributed `events.ts` files across all apps | Events are scattered — no single place to see what's tracked |
| Analytics | Event taxonomy (tracker) | `packages/analytics` client + shared property schemas | User/team props are defined once but their usage is invisible |
| GTM | Plans | Plan tier definitions in `packages/shared` | Plan definitions live in code, disconnected from sales/marketing |
| GTM | Plan features | Feature gate middleware in `apps/api` + UI checks in `apps/web` | Feature gating logic is buried in middleware, not visible to GTM teams |
| Product | Email templates | `packages/email` React Email templates | Templates are in code — product and marketing can't see what gets sent |
| Product | Toggleable features | Org-level toggle definitions in `apps/api` + `apps/web` | No inventory of what can be turned on/off per workspace |
| Product | Feature flags | LaunchDarkly flag keys defined as typed constants across apps | Flags are referenced throughout the codebase with no central record |
| Product | Feature tips | Tip definitions + dismissal logic in `apps/web` | In-app guidance is invisible to product and support teams |
