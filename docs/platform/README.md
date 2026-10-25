# How SIMADRepair works today

A map of the platform **as the code currently behaves**, split by role. It is the baseline for the improvement work: for each role we write a draft of how it *should* work (`docs/platform/<role>.md`), grill it with `/grill-with-docs`, then change the code bit by bit.

Order we'll go through: **1. Requester (public) → 2. Lead Technician → 3. Technician → 4. Admin → 5. Cross-cutting** (statuses, notifications, reports).

---

## The one-paragraph version

A requester (student, lecturer, staff) fills a public form with no account. They get a tracking code like `SIM-2026-000123`. They bring the device in; a **Lead Technician** checks it in, records where it is stored, and assigns it to a **Technician**. The technician moves it to *In repair* and then *Ready for pickup*. The requester returns, and the lead (or admin) confirms who collected it. An **Admin** manages staff and sees reports. Every step writes a `RepairEvent`, which is the audit trail.

## Two state machines run side by side

**Repair status** (what the requester sees) — `RepairTicket.status`, `src/lib/constants/repair-status.ts`:

```
REGISTRATION_COMPLETED → DEVICE_RECEIVED → REPAIR_IN_PROGRESS → READY_FOR_COLLECTION → DEVICE_COLLECTED
   "Submitted"             "Received"         "In repair"          "Ready for pickup"      "Collected"
```

**Custody status** (where the physical device is) — `DeviceCustody.status`, `src/lib/service-desk/workflow.ts`:

```
NOT_RECEIVED → RECEIVED → IN_REPAIR_ROOM → READY_FOR_COLLECTION → COLLECTED
                   └──────────────────────────┘ (can skip repair room)
```

Some actions move both at once (check-in, ready, pickup). They're kept in sync by hand in each service, not by one rule.

## Data model (prisma/schema.prisma)

| Model | What it is |
| --- | --- |
| `User` | Staff only. Roles: `ADMIN`, `LEAD_TECHNICIAN`, `TECHNICIAN`. |
| `Requester` | A person who asked for a repair. No login. Reused by university ID, else by phone, if exactly one match. |
| `Device` | The machine. Linked to a `Requester` (new flow) or a `User` owner (legacy field `ownerId`). |
| `RepairTicket` | One repair. Has `ticketId` = `trackingCode` for public requests. |
| `DeviceCustody` | One per ticket: received by whom, storage location, condition, who collected it. |
| `RepairEvent` | Append-only log of every change, with actor and role. |
| `TrackingCodeCounter` | Per-year sequence for tracking codes. |

---

## 1. Requester (public, no account)

| Step | Screen | API | Code |
| --- | --- | --- | --- |
| Submit request (name, type, ID, faculty, phone, device, issue) | `/request-repair` | `POST /api/public/repair-requests` | `src/lib/service-desk/public-requests.ts` |
| Get tracking code | shown on success | — | `createTrackingCode()` |
| Track progress | `/track` | `GET /api/public/tracking/[trackingCode]` (rate-limited) | `src/lib/service-desk/public-tracking.ts` |
| Also: legacy lookup | `/lookup/[ticketId]` | `GET /api/lookup/[ticketId]` (no rate limit) | `src/lib/lookup/ticket-lookup-service.ts` |

What tracking shows: status, first name only, device, and the assigned technician's **name and phone**.

What creating a request does, in one transaction: reuse/create `Requester` → create `Device` → allocate tracking code → create ticket (`REGISTRATION_COMPLETED`) → create custody (`NOT_RECEIVED`) → log `TICKET_CREATED`.

## 2. Lead Technician — "Command Center"

Lands on `/lead` after login. Nav: Command Center, Dashboard, Ticket Queue, Device Custody, Reports, Add Technician.

| Action | API | Effect |
| --- | --- | --- |
| See the queue | `GET /api/lead/tickets` | `listLeadQueue()` in `lead-workspace.ts` |
| Check device in (storage location, condition) | `POST /api/lead/tickets/[id]/custody` | custody → `RECEIVED`; status `Submitted` → `Received` |
| Assign technician | `PATCH /api/lead/tickets/[id]/assign` | sets `technicianId`, logs `TECHNICIAN_ASSIGNED` |
| Move custody (repair room / ready) | `PATCH .../custody/status` | `READY_FOR_COLLECTION` also flips repair status to Ready |
| Confirm pickup (collector name, phone) | `PATCH .../custody/pickup` | custody `COLLECTED`, status `DEVICE_COLLECTED`, `closedAt` |
| List technicians | `GET /api/lead/technicians` | |

Custody management is **lead or admin only** (`ensureCustodyManager` in `device-custody.ts`).

## 3. Technician — "Assigned Tickets"

Lands on `/technician/workspace`. Nav: Assigned Tickets, My Queue, History.

| Action | API | Rule |
| --- | --- | --- |
| See my queue | `GET /api/technician/workspace/tickets` | only tickets assigned to me, not collected |
| Open a ticket | `GET .../tickets/[id]` | |
| Start repair | `PATCH .../tickets/[id]/status` → `REPAIR_IN_PROGRESS` | needs status `Received`; custody → `IN_REPAIR_ROOM` |
| Mark ready | same → `READY_FOR_COLLECTION` | needs `In repair`; custody → `READY_FOR_COLLECTION` |

Technicians cannot check in, assign, or release devices.

## 4. Admin

Lands on `/dashboard`. Nav: Overview, Requests, Reports, Devices & Custody, Staff.

| Action | Screen / API |
| --- | --- |
| Create staff, change roles, activate/deactivate | `/admin/users`, `POST /api/users`, `PATCH /api/users/[id]` |
| Reports | `/reports`, `GET /api/reports/overview` (admin only) |
| All tickets / devices | `/repair-tickets`, `/admin/devices` |
| Everything a lead can do | lead APIs allow `ADMIN` |

First admin comes from `prisma/seed.ts`.

## 5. Cross-cutting

- **Auth**: email + password, JWT session cookie (`src/lib/auth/session.ts`), login rate-limited. Inactive users are rejected on every request.
- **Redirect after login**: `src/app/auth/login/redirects.ts`.
- **Uploads**: `POST /api/uploads/repair-ticket-photo` (any staff).
- **Dashboard**: `GET /api/dashboard`, scoped by role (`dashboard-service.ts`).
- **Notifications**: none yet. `docs/mvp-development-plan.md` plans a WhatsApp pickup message.
- **Tests**: Vitest unit/integration beside the code, Playwright in `e2e/`.

---

## Things that look odd — good grilling material

These are observations from reading the code, not confirmed bugs. We'll settle each one when we reach its role.

1. **Two ticket APIs.** The older `/api/repair-tickets/*` (assign = admin only, generic status update) lives next to the newer `/api/lead/*` and `/api/technician/*`. Which one is the real workflow?
2. **`requireTicketAccess` ignores Lead Technicians** (`src/lib/auth/authorization.ts`) — admin or the assigned technician only, while `canTechnicianWorkOnTicket` lets leads through.
3. **Pickup has no verification.** `pickupCodeHash` is always `null`; pickup is confirmed by typing a name. Anyone with the tracking code can claim to be the owner.
4. **Public tracking shows the technician's phone number.** Is that wanted? (The faculty doc says students shouldn't disturb technicians.)
5. **`/api/lookup/[ticketId]` is public with no rate limit**, unlike `/api/public/tracking`.
6. **Two status machines kept in sync by hand** in three different services. Easy to drift.
7. **No cancel / reject / "can't fix" path**, although `TICKET_CANCELLED` and `cancelledAt` exist.
8. **Requester reuse by phone** can merge two different people sharing a phone, or split one person who changed numbers.
9. **`Device.ownerId`** (device owned by a staff `User`) is left over from the old student/lecturer accounts.
10. **README links to docs that don't exist** (`PROJECT_DEFINITION.md`, `ARCHITECTURE.md`, ...) and still says "FarsamoTech Repair Hub".

## How we'll work

1. You write `docs/platform/<role>.md` — a rough draft of how that role *should* work. Bullet points are fine.
2. Run `/grill-with-docs` on it. I question you one decision at a time; resolved terms go to `GLOSSARY.md`, real decisions become ADRs in `docs/adr/`.
3. `/to-spec` → `/to-tickets` turns it into GitHub issues.
4. `/implement` or `/tdd` per ticket, small PRs.
