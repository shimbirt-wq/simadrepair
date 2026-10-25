# SIMADRepair

SIMAD University IT Service Desk for Computer Maintenance Week: students and staff register a device online, drop it off at the event, follow the repair, and collect it with their university ID card. Lead technicians run the desk, volunteer technicians repair, admins run the event and its report.

Built by the Faculty of Computing engineering team, SIMAD University.

## Documentation

- [How the platform works, role by role](docs/platform/README.md)
- [Spec](docs/platform/spec.md) — GitHub issue #6, tickets #7–#32
- [Design system](docs/platform/design-system.md) and [UI principles](docs/platform/ui-principles.md)
- [Faculty documentation](docs/SIMADRepair-Faculty-Documentation.md)

## Stack

Next.js 15 (App Router) + TypeScript, Prisma, PostgreSQL on Supabase, Vitest and Playwright.

## Development

```bash
cp .env.example .env    # fill in database and JWT settings
npm install
npm run prisma:migrate
npm run prisma:seed     # creates the first admin
npm run dev
```

Checks before pushing: `npm run lint`, `npm run typecheck`, `npm test`.

## Deploying (Vercel)

Production builds apply pending database migrations before `next build` (`scripts/migrate-on-deploy.mjs`), so the live database always matches the code. This needs `DIRECT_URL` (the direct Supabase connection, port 5432) set in Vercel; previews and local builds skip the step.

## Scheduled job

`GET /api/cron/retention` runs once a day (see `vercel.json`) with `Authorization: Bearer $CRON_SECRET`. It erases personal details of tickets whose event ended more than 12 months ago and keeps anonymous numbers for reports. It also clears unclaimed photo uploads and expired rate-limit counters. On other hosts, call it from any scheduler with the same header.
