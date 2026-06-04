# SparkDesk — Session Handoff

## Repo

- **Local path:** `/Users/kirkhlavka/workspace/repos/sparkdesk-demo`
- **Remote:** `https://github.com/sibylity/sparkdesk-demo.git`
- **Current branch:** `feature/phase-1-foundation`
- **Push status:** Pending collaborator access for `khlav` on `sibylity/sparkdesk-demo`. Once granted, run:
  ```bash
  git push -u origin feature/phase-1-foundation
  ```

## What's Been Built

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation — Next.js web app, Hono API, Prisma schema, WorkOS auth, seed data | ✅ Done |
| 2 | Analytics — `packages/analytics`, distributed `events.ts` across all apps | ✅ Done |
| 3 | Email — `packages/email`, 6 React Email templates, Resend sender, wired to API routes | ✅ Done |
| 4 | GTM/Product Surface — plan gates, feature toggle catalog, LaunchDarkly flag constants, feature tips + TipBanner | ✅ Done |
| 5 | Slack — `apps/slack` Bolt app, 4 event handlers, `analytics/events.ts`, API slack routes | ✅ Done |

## Running Locally

```bash
docker compose up -d              # Start postgres (Docker)
pnpm install
pnpm --filter @sparkdesk/api db:push
pnpm --filter @sparkdesk/api db:seed
```

Start servers:
```bash
pnpm --filter @sparkdesk/api dev    # API on :3001
pnpm --filter @sparkdesk/web dev    # Web on :3000
```

Seed outputs `DEMO_ORG_ID` and `DEMO_AGENT_ID` — put these in `apps/web/.env.local`.

**Important:** Use Docker for postgres, NOT Homebrew. If Homebrew postgres is running: `brew services stop postgresql@17`.

## Implementation Gaps — Next Session Priority Matrix

### P1 — Fix Before Demo

| Item | Effort | Notes |
|------|--------|-------|
| Resolve button | XS | Server action, `PATCH /internal/tickets/:id` with `{ status: 'resolved' }` |
| Priority dropdown on ticket detail | XS | Select in header, same PATCH endpoint |
| Team page — agent list + role management | S | `GET /internal/agents` + `PATCH /internal/agents/:id` both ready |
| Settings page — feature toggle switches | S | `GET/PATCH /internal/settings/toggles` both ready |
| Customers page — list + search | S | `GET /internal/customers` ready |
| Assign button + agent picker dropdown | M | Needs agent list fetch + dropdown UI |
| Reports dashboard (simple) | M | 4 stat cards + basic ticket volume, no date filtering needed |

### P2 — Complete the Surface

| Item | Effort | Notes |
|------|--------|-------|
| New ticket button + create form modal | M | `POST /internal/tickets` ready |
| Integrations page — Slack status + connect | M | Show SlackConnection state, placeholder OAuth button |
| Customer detail + conversation timeline | M | `GET /internal/customers/:id/timeline` ready |
| Snooze button + date picker | M | Needs datetime input component |

### P3 — Polish

| Item | Effort | Notes |
|------|--------|-------|
| UI overhaul — design review via Claude vision tools | L | Full visual pass: spacing, typography, consistency, polish |

## Key Files

```
apps/web/src/app/(app)/           — all pages (inbox, tickets, customers, team, etc.)
apps/web/src/components/tickets/  — ticket list, ticket item, thread, reply box
apps/web/src/lib/api-client.ts    — all API calls from web to API
apps/api/src/routes/              — Hono route handlers
apps/api/prisma/schema.prisma     — database schema
packages/shared/src/plans.ts      — PLAN_FEATURES (plan gates)
packages/shared/src/feature-flags.ts — FEATURE_FLAGS (LaunchDarkly constants)
apps/web/src/lib/tips.ts          — FEATURE_TIPS (tip definitions)
apps/api/src/config/feature-toggles.ts — FEATURE_TOGGLES (toggle catalog)
```

## Implementation Plans

Full task-by-task plans with complete code for each phase:
- `docs/superpowers/plans/2026-06-03-phase-1-foundation.md`
- `docs/superpowers/plans/2026-06-03-phase-2-analytics.md`
- `docs/superpowers/plans/2026-06-03-phase-3-email.md`
- `docs/superpowers/plans/2026-06-03-phase-4-gtm-product.md`
- `docs/superpowers/plans/2026-06-04-phase-5-slack.md`

## Dev Notes

- `DEMO_ORG_ID` / `DEMO_AGENT_ID` are used throughout web pages — always read from `process.env`
- All external integrations (PostHog, Resend, Slack, LaunchDarkly) degrade gracefully when keys absent
- `apps/slack` exits cleanly without Slack credentials — not a crash
- Slack app can be set up from `slack-app-manifest.yml` in repo root
- CI runs typecheck + tests on PR/push to main (`.github/workflows/ci.yml`)
