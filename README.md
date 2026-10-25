# SIMADRepair

SIMAD University IT Service Desk for Computer Maintenance Week: students and staff register a device online, drop it off at the event, follow the repair, and collect it with their university ID card. Lead technicians run the desk, volunteer technicians repair, admins run the event and its report.

Built by XeelTech Solutions.

## Documentation

- [How the platform works, role by role](docs/platform/README.md)
- [Spec](docs/platform/spec.md) — GitHub issue #6, tickets #7 onwards
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
