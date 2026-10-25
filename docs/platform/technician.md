# Technician — Workspace

Status: **agreed**. Builds on `requester.md` (structured intake, photos, outcomes) and `lead-technician.md` (tag numbers, claim pool, claim cap, lead confirms "Cannot be repaired").

---

## 1. How it works today

- Logs in → `/technician/workspace` (`src/components/service-desk/technician-workspace.tsx`, service `src/lib/service-desk/technician-workspace.ts`).
- **Repair queue**: only tickets assigned to me, not yet collected. Filter: Ready to start / In repair / Ready for pickup. Counters.
- **Ticket detail**: requester (incl. phone), device, issue text, timeline, WhatsApp link to the requester.
- **Two buttons**: **Start repair** (`Received` → `In repair`, custody → in repair room) and **Mark ready** (`In repair` → `Ready`, custody → ready). API `PATCH /api/technician/workspace/tickets/[id]/status`.
- The API accepts a `note`, but the UI never sends one.

## 2. Problems

| # | Problem |
| --- | --- |
| T1 | **No record of the work.** No diagnosis, no "what I did", no parts. Tickets end with zero knowledge captured, and reports can't say what was fixed. |
| T2 | **Only two states.** No way to say "waiting for parts", "need the student", or "can't fix". |
| T3 | **Thin starting info.** Just free text; no specs, no photos, no condition from check-in. |
| T4 | **No pool to claim from** (LD5) and no way to hand a ticket back. |
| T5 | **No notes at all**, internal or otherwise. |
| T6 | Desktop-style layout; technicians at a bench will use their phones. |

## 3. Design

### 3.1 Assumed decisions (no need to discuss — say if any is wrong)
| # | Decision |
| --- | --- |
| TA1 | **Mobile-first workspace.** Big tag number, big buttons, works one-handed on a phone. |
| TA2 | **Tabs:** My tickets · Pool (claim, cap 3 — LD16) · Done today. Auto-refresh 30 s. Urgent first, then oldest. |
| TA3 | **Ticket view shows everything from intake and check-in:** tag # + zone, priority, specs (OS, RAM, storage, age), problem categories + follow-up answers, error message, requester photos, check-in condition, damage photos, accessories. |
| TA4 | **Start repair** = one tap. |
| TA5 | **Blocked actions:** *Waiting for parts* (part name), *Action needed* (what's needed → offers the ready-made WhatsApp message), *Propose cannot repair* (reason → lead confirms, LD17). Each one is a status the board shows in "Blocked". |
| TA6 | **Repair record required before "Ready":** actual fault (same category list), actions done (checklist: Windows reinstall, virus removal, drivers/updates, software install, RAM upgrade, SSD/HDD replace, cleaning + thermal paste, battery, keyboard, screen, charger port, other) + short note. |
| TA7 | **Final test checklist before "Ready":** boots, charges, Wi-Fi, keyboard/touchpad, screen. Quick ticks, no separate QA person. |
| TA8 | **Notes are internal** (staff only). The requester sees status changes only. |
| TA9 | **Release ticket** back to the pool, or ask the lead to reassign, with a reason. |
| TA10 | **Time is measured automatically** from events (claimed → started → ready). No manual timers. |
| TA11 | Requester phone + WhatsApp button stay visible to the assigned technician only. |


---

## 4. Decisions log

| # | Decision | Round |
| --- | --- | --- |
| TD1 | All assumed decisions TA1–TA11 accepted. | 1 |
| TD2 | **Passwords:** entered at the desk at check-in, stored encrypted, visible only to the assigned technician, **auto-deleted at pickup** (and at event end). Never on paper. | 1 |
| TD3 | **Parts:** the student buys and brings them. Technician names the exact part; the "Action needed" WhatsApp message tells the student what to buy. No inventory. | 1 |
| TD4 | **Wipe permission:** optional checkbox on the request form, "OK to reinstall Windows if needed". Ticked → technician proceeds; not ticked → "Action needed" and wait. | 1 |
| TD5 | **Software:** only free or university-licensed software. Licence list to be supplied by SIMAD IT. | 1 |
