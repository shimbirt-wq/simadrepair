# SIMADRepair

IT service desk for SIMAD University device repairs. Next.js 15 (App Router) + Prisma + PostgreSQL (Supabase), one TypeScript codebase.

- Domain logic lives in `src/lib/**` (services), HTTP in `src/app/api/**/route.ts`, screens in `src/app/**/page.tsx`.
- How the platform works, role by role: `docs/platform/README.md`. Read it before changing a workflow.
- Ticket status changes go only through `src/lib/tickets/workflow.ts` (decides) and `src/lib/tickets/ticket-service.ts` (persists). Never write `status` elsewhere. See `docs/adr/0001-single-ticket-lifecycle.md`.
- UI uses the components in `src/components/ui` and the tokens in `docs/platform/design-system.md`; no inline styles in new screens.
- Integration tests need `TEST_DATABASE_URL` (see `.env.example`); they skip without it.
- Checks before pushing: `npm run lint`, `npm run typecheck`, `npm test`.

## Agent skills

Matt Pocock's engineering and productivity skills are vendored in `.claude/skills/` (MIT, see `.claude/skills/LICENSE-mattpocock-skills`).

### Issue tracker

Issues and specs live in GitHub Issues on `shimbirt-wq/simadrepair`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root, created as terms and decisions get resolved. See `docs/agents/domain.md`.
