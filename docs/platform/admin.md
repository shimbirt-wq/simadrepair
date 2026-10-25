# Admin

Status: **agreed**.

> **Event** = one Computer Maintenance Week (e.g. "Maintenance Week 2026, 10–14 Nov, Main Hall"). Each year's week is a new event, so its tickets, tag numbers (#001…), staff and report stay separate from other years.

---

## 1. How it works today

- Logs in → `/dashboard`. Nav: Overview, Requests, Reports, Devices & Custody, Staff. Can also use every lead screen.
- **Staff** (`/admin/users`, `src/lib/users/user-service.ts`): create accounts, change role, activate/deactivate. The last active admin can't be demoted. First admin comes from `prisma/seed.ts`.
- **Reports** (`/reports`, `src/lib/reports/report-service.ts`): counts by status, faculty, device type, monthly trend, and "common problems" guessed from **keywords in the free-text description**. Date-range filter.
- **Devices** (`/admin/devices`) and **Requests** (`/repair-tickets`) — the older pages (to be retired, LD13).
- No event settings, no audit view, no export, no message templates, no data clean-up.

## 2. Problems

| # | Problem |
| --- | --- |
| A1 | Nothing is organised **per event**; reports are by month, which doesn't fit a one-week event. |
| A2 | Reports guess problems from keywords; there's no fix rate, turnaround time, technician performance, or satisfaction. |
| A3 | No export to share results with faculty heads / management. |
| A4 | Creating 8–15 technician accounts one by one before each event is slow; accounts stay active forever. |
| A5 | No way to see the audit trail across tickets ("who released device #147?"). |
| A6 | Personal data (phones, IDs, passwords — TD2) is kept forever. |

## 3. Design

### 3.1 Assumed decisions (say if any is wrong)
| # | Decision |
| --- | --- |
| AA1 | **Events page**: create/edit the event (D13: name, dates, venue, hours, desk WhatsApp number, uncollected-hold days). One active event at a time. Every ticket belongs to an event. |
| AA2 | **Event report** (replaces monthly report): registered, received, fixed, cannot repair, collected, uncollected; fix rate; median time received → ready; top faults and actions (from the repair record, TA6); by faculty, device type, technician; average rating. Compare with previous events. |
| AA3 | **Live overview** during the event: today's numbers, stuck tickets, technician load. Same data as the lead board summary. |
| AA4 | **Staff page**: role, skill tags (LD6), active toggle, bulk-add technicians from a pasted list (name, email, phone). Generated passwords shown once. |
| AA5 | **Audit search**: find any ticket by code, tag, or university ID and see its full timeline with who did what. |
| AA6 | **Admin can do everything a lead can**, plus undo pickup (LD18). |
| AA7 | **Event settings drive all public text** (venue, hours, number, policy days); nothing hard-coded. |
| AA8 | Category lists, accessories and action checklists are **fixed in code for v1** (change by a small PR). |


---

## 4. Decisions log

| # | Decision | Round |
| --- | --- | --- |
| AD1 | All assumed decisions AA1–AA8 accepted. | 1 |
| AD2 | **Technicians are mostly student volunteers.** Technician accounts are tied to an event and **deactivate automatically when it ends**; the admin re-activates them for the next event. | 1 |
| AD3 | **Final report:** one-page PDF summary (faculty heads, management) + CSV of all tickets. | 1 |
| AD4 | **Data retention:** personal details (name, phone, university ID) kept 12 months after the event, then erased; anonymous stats kept. Passwords deleted at pickup (TD2). | 1 |
