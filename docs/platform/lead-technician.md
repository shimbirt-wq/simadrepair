# Lead Technician — Command Center

Status: **draft — being grilled**. Section 1 is how the code works today. Section 3 is a proposal, not decided. Builds on the requester decisions in `requester.md` (event-week focus, ID pickup, WhatsApp messages, outcomes).

---

## 1. How it works today

### 1.1 Where the lead works
- Logs in → `/lead` (`src/app/lead/page.tsx`, UI `src/components/service-desk/lead-command-center.tsx`). Admins can open it too.
- Nav: Command Center, Dashboard, Ticket Queue, Device Custody, Reports, Add Technician.

### 1.2 The Command Center screen
- **Left: "Active requests"** — every ticket not yet collected, oldest first, loaded all at once (`listLeadQueue()` in `src/lib/service-desk/lead-workspace.ts`). Search box + filter: All / Not received / Unassigned / In repair / Ready.
- Counters: not received, unassigned, ready.
- **Right: selected ticket** — requester, device, issue, timeline, and three actions:

| Action | API | What it does | Notes |
| --- | --- | --- | --- |
| **Receive device** | `POST /api/lead/tickets/[id]/custody` | custody → `RECEIVED`, status → `Received`, stores storage location (default text "IT service desk") | The API accepts a `condition` note, but the UI never sends one. |
| **Assign technician** | `PATCH /api/lead/tickets/[id]/assign` | sets technician, logs `TECHNICIAN_ASSIGNED` | Works at any stage, even before the device arrives. Reassigning needs no reason. Leads can be assigned too. |
| **Confirm pickup** | `PATCH /api/lead/tickets/[id]/custody/pickup` | custody → `COLLECTED`, status → `Collected` | The UI **auto-fills the collector as the requester** — nobody records who actually took the device. |

Also available through the API but **not in the UI**: moving custody to "In repair room" / "Ready" (`.../custody/status`), and the technician status endpoint (leads are allowed).

### 1.3 Other lead powers
- **Create technician accounts** (`POST /api/users`; a lead can only create `TECHNICIAN`, `src/lib/users/user-service.ts`).
- **Reports** page (`/reports`) — reads the service directly. The matching API `GET /api/reports/overview` is admin-only, so the two disagree.
- **Dashboard** with a lead-specific summary (`src/lib/dashboard/dashboard-service.ts`).

---

## 2. Problems (senior review, for an event week)

| # | Problem | Why it matters during the week |
| --- | --- | --- |
| L1 | **No physical device label.** Nothing links a laptop on the table to its ticket except a typed storage location. | With 100+ similar black laptops, devices get mixed up. This is the #1 operational risk. |
| L2 | **No walk-in registration.** Students who didn't fill the form must do it on their phone at the desk. | Slows the queue at peak times. |
| L3 | **Check-in records almost nothing**: no ID check, no condition, no accessories, no photos of existing damage. | Disputes at pickup ("my screen wasn't cracked", "where is my charger?"). |
| L4 | **Pickup doesn't capture the real collector** and doesn't check the ID (D10). | Wrong person can take a device; no record of who did. |
| L5 | **No workload view.** The lead can't see who's free or overloaded. | Uneven work, idle technicians. |
| L6 | **Queue doesn't refresh**; loads every ticket at once. | Stale screen; slow when hundreds of tickets. |
| L7 | **No "stuck" signal.** Nothing highlights a device received hours ago and still unassigned. | Devices get forgotten. |
| L8 | **No way to fix mistakes** (wrong check-in, wrong technician) except by moving forward. | Bad data, workarounds. |
| L9 | **No priority.** A thesis laptop due tomorrow waits like everything else. | |
| L10 | **No end-of-event tools** for D11 (move uncollected to IT office, close unfinished). | Manual, error-prone on the last day. |
| L11 | **Two ticket systems.** `/repair-tickets` and `/devices` pages (older API) sit next to the Command Center. | Confusing; two places to do the same thing. |

---

## 3. Proposal — Command Center for the event week

### 3.1 Layout: a board, not a list
Columns (auto-refresh every 30 s):

```
Waiting drop-off │ To assign │ In repair │ Blocked │ Ready for pickup │ Collected today
                                         (parts / action needed)
```
Each card: code, device, category, age, technician, priority badge, **stuck** highlight.

### 3.2 Desk actions
| Action | Proposal | Fixes |
| --- | --- | --- |
| **Desk registration** | Same form as the public one, compact, filled by the lead for walk-ins. | L2 |
| **Check-in** | Find by code or university ID → check ID card → condition checklist (scratches, cracked screen, missing keys) + accessories received + optional photos → choose bin/shelf → **print label** (code + QR + name + bin). | L1, L3 |
| **Triage** | Priority Normal / Urgent; confirm problem category. | L9 |
| **Assign** | Technician picker shows each person's open load and skills; reassign requires a short reason. | L5, L8 |
| **Pickup** | Search by university ID → shows that person's ready devices → check ID card, scan/enter label, tick accessories returned, enter collector name + phone. | L4 |
| **Correct** | "Undo last step" with a required reason, logged in the timeline. | L8 |
| **WhatsApp** | One-tap ready-made messages (D9). | |
| **End of event** | Bulk: move ready-but-uncollected to "IT office" + reminder message; mark unfinished "Cannot be repaired – event ended". | L10 |

### 3.3 Event dashboard for the lead
Today: registered, received, in repair, ready, collected; per-technician throughput; stuck list.

### 3.4 Cleanup
Retire the old `/repair-tickets` and `/devices` staff pages, or make them read-only history. One place to work. (L11)

---

## 4. Decisions log

| # | Decision | Round |
| --- | --- | --- |
| LD1 | **Scale:** 200–500 devices per event, 1–2 leads, 8–15 technicians. Search by typing is enough; no barcode/QR scanning. | 1 |
| LD2 | **No printer.** Labels are hand-written stickers. | 1 |
| LD3 | **Desk registration** for walk-ins (compact version of the public form). | 1 |
| LD4 | **Check-in records:** ID card checked, condition checklist, accessories received, up to 2 optional damage photos. | 1 |
| LD5 | **Assignment = both:** technicians claim from the "To assign" pool; the lead can assign/reassign any time. | 1 |
| LD6 | **Skill tags** (Hardware, Software/OS, Network) + open workload shown in the picker. No auto-assign. | 1 |
| LD7 | **Priority:** Normal / Urgent, set at check-in. | 1 |
| LD8 | **Pickup screen:** search by university ID → that person's ready devices → check label, tick accessories returned, enter collector name + phone. | 1 |
| LD9 | **Undo last step** with required reason, lead/admin only, logged in timeline. | 1 |
| LD10 | **Board view**, refresh every 30 s; red when received + unassigned > 1 h or in repair > 1 day. | 1 |
| LD11 | **End-of-event bulk actions** (move uncollected to IT office + reminder; close unfinished). | 1 |
| LD12 | **Leads can repair** (assign to themselves, use technician workspace). | 1 |
| LD13 | **Retire old `/repair-tickets` and `/devices` staff pages**; keep read-only history. | 1 |
