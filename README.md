# SparkDesk

A B2B SaaS help desk platform for support teams. Manage tickets, communicate with customers across channels, and keep your team aligned — all in one place.

## Monorepo Structure

```
sparkdesk-demo/
├── apps/
│   ├── web/          Next.js 15 — agent dashboard
│   ├── api/          Hono — internal + public REST API
│   └── slack/        Slack Bolt — bidirectional Slack integration
└── packages/
    ├── analytics/    PostHog client + shared event property schemas
    ├── email/        React Email — transactional email templates
    └── shared/       Zod schemas + TypeScript types
```

## Tech Stack

- **Turborepo** + pnpm workspaces
- **Next.js 15** (App Router, Server Components, Server Actions)
- **Hono 4** on Node.js (`@hono/node-server`)
- **Prisma 5** + PostgreSQL
- **WorkOS AuthKit** + Organizations (auth + multi-tenancy)
- **Slack Bolt 4** (Socket Mode for local dev)
- **PostHog** (analytics, server-side + browser)
- **Resend** + React Email (transactional email)
- **LaunchDarkly** (feature flags)
- **shadcn/ui** + Tailwind CSS v4

## Prerequisites

- Node.js 22.x
- pnpm 9.x
- Docker (for PostgreSQL)

## Setup

**1. Start the database**

```bash
docker compose up -d
```

**2. Install dependencies**

```bash
pnpm install
```

**3. Configure environment variables**

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

Fill in the required values (WorkOS credentials, database URL, etc.). See the `.env.example` files for full documentation.

**4. Push the database schema and seed demo data**

```bash
pnpm --filter @sparkdesk/api db:push
pnpm --filter @sparkdesk/api db:seed
```

**5. Start development servers**

```bash
pnpm dev
```

- Web dashboard: http://localhost:3000
- API: http://localhost:3001
- Slack app: http://localhost:3002 (requires Slack credentials)

## Required Environment Variables

### `apps/api/.env`

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `INTERNAL_API_SECRET` | ✅ | Shared service token for internal routes |
| `WEB_APP_URL` | ✅ | Web app base URL (for CORS) |
| `POSTHOG_API_KEY` | — | PostHog server-side key |
| `RESEND_API_KEY` | — | Resend API key for transactional email |
| `LAUNCHDARKLY_SDK_KEY` | — | LaunchDarkly Node SDK key |
| `DEMO_USER_WORKOS_ID` | — | Your real WorkOS user ID — when set, the seed assigns it to the demo agent so you're recognized as yourself (rather than "Jamie Diaz") after logging in |

### `apps/web/.env.local`

| Variable | Required | Description |
|---|---|---|
| `WORKOS_CLIENT_ID` | ✅ | WorkOS client ID |
| `WORKOS_API_KEY` | ✅ | WorkOS API key |
| `WORKOS_COOKIE_PASSWORD` | ✅ | Session cookie encryption key (32+ chars) |
| `NEXT_PUBLIC_WORKOS_CLIENT_ID` | ✅ | WorkOS client ID (public) |
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | ✅ | Auth callback URL |
| `INTERNAL_API_URL` | ✅ | API base URL |
| `INTERNAL_API_SECRET` | ✅ | Shared service token |
| `DEMO_ORG_ID` | ✅ | Seeded demo organization ID (`demo-org`) |
| `DEMO_AGENT_ID` | ✅ | Fallback demo agent ID (`demo-agent`) — used if no agent matches your WorkOS user |
| `NEXT_PUBLIC_POSTHOG_KEY` | — | PostHog browser key |

### `apps/slack/.env`

See `apps/slack/.env.example`. Requires a Slack app created at [api.slack.com/apps](https://api.slack.com/apps) with Socket Mode enabled.

## Optional Integrations

All external integrations degrade gracefully when credentials are absent — the app is fully functional without them.

| Integration | Purpose | Env var |
|---|---|---|
| PostHog | Product analytics | `POSTHOG_API_KEY` / `NEXT_PUBLIC_POSTHOG_KEY` |
| Resend | Transactional email | `RESEND_API_KEY` |
| LaunchDarkly | Feature flags | `LAUNCHDARKLY_SDK_KEY` |
| Slack | Bidirectional ticket sync | `SLACK_BOT_TOKEN` + `SLACK_SIGNING_SECRET` + `SLACK_APP_TOKEN` |

## Development

```bash
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm typecheck        # TypeScript across all packages
```

### Database

```bash
pnpm --filter @sparkdesk/api db:push      # Push schema changes (dev)
pnpm --filter @sparkdesk/api db:generate  # Regenerate Prisma client
pnpm --filter @sparkdesk/api db:studio    # Open Prisma Studio
pnpm --filter @sparkdesk/api db:seed      # Seed demo data
pnpm --filter @sparkdesk/api db:reseed    # Clear tickets/customers for the demo org and reseed
pnpm --filter @sparkdesk/api db:reset     # Full reset — drops schema, re-pushes, and reseeds
```

The seeded organization and demo agent always get stable IDs (`demo-org` / `demo-agent`), so `.env` values never need to change across reseeds. Set `DEMO_USER_WORKOS_ID` before reseeding to have the app recognize you as yourself rather than the default demo persona.

For demos, visit `/demo` (not in the nav) to inject realistic sample tickets into the live queue with one click.

### Tests

```bash
pnpm --filter "@sparkdesk/*" test         # Run all package tests
```
