# Spec — SIMADRepair for Computer Maintenance Week

Synthesised from the agreed role documents in `docs/platform/` (requester, lead-technician, technician, admin, ui-principles, design-system). Decision IDs (D…, LD…, TD…, AD…) refer to those documents.

## Problem Statement

SIMAD University runs a Computer Maintenance Week where 200–500 student, lecturer and staff devices are repaired by 1–2 lead technicians and 8–15 mostly volunteer student technicians. The current platform covers only the happy path and is unsafe and thin for that event:

- **Requesters** fill a free-text form that gives technicians almost nothing to start from, get a guessable sequential tracking code, receive no messages, can't recover a lost code, and see no outcome other than "in repair" when something goes wrong.
- **Anyone** can enumerate tracking codes and read every ticket. Pickup is not verified: the system auto-fills the requester as the collector, so nobody knows who actually took a device.
- **Lead technicians** have no physical device labels, no walk-in registration, no workload view, no stuck alerts, no way to correct mistakes, and no end-of-event tools. Check-in records nothing about condition or accessories, which invites disputes.
- **Technicians** have two buttons and record nothing about the fault or the fix, so the event produces no knowledge and the reports can't say what was repaired.
- **Admins** can't organise work per event, get reports that guess problems from keywords, can't export results for faculty heads, keep volunteer accounts active forever, and keep personal data forever.
- **The UI** mixes inline styles and two visual languages, and explains itself with paragraphs instead of being self-evident.

## Solution

A single, event-centred repair desk:

- Every ticket belongs to an **Event** (one Maintenance Week) whose settings — dates, venue, hours, desk WhatsApp number, hold days — drive the form window, public text, messages, tag numbering, volunteer account expiry and the report.
- Requesters register through a short **multi-step form** capturing their university ID, Somali phone, structured device specs, problem categories with follow-up diagnosis questions, up to 3 photos, wipe permission and consent. They receive a **random tracking code**, can **track**, **find** lost codes with ID + last 4 phone digits, **cancel** before drop-off, and **rate** after collection.
- One **ticket lifecycle** replaces the two hand-synced status machines and adds the outcomes Waiting for parts, Action needed, Cannot be repaired and Cancelled.
- Leads work a **live board**: desk registration, check-in (ID check, condition, accessories, damage photos, password, tag number written on a sticker, zone, priority), assignment with load and skills, pickup by university ID with the real collector recorded, undo with reason, confirmation of "cannot repair", and end-of-event bulk actions.
- Technicians use a **phone-first workspace**: claim from a pool (cap 3), see everything from intake and check-in, record the fault, actions and a test checklist before marking ready, and flag blocked states.
- Staff send **ready-made WhatsApp messages** from the platform; every send is logged. A WhatsApp Cloud API adapter can replace manual sending later without changing callers.
- Admins manage events, bulk-add volunteers whose accounts expire with the event, search the audit trail, and export an **event report** (PDF + CSV). Personal data is erased 12 months after an event; passwords are deleted at pickup.
- Every screen follows the **design system** (emerald accent, Hanken Grotesk + IBM Plex Mono, 4 px grid) and the UI principles: one primary action, no explaining text, no vague choices.

## User Stories

### Requester — registering
1. As a requester, I want the request form to be open only during the event window, so that I don't bring a device when nobody is there.
2. As a requester, I want a clear "closed — next event soon" page outside the window, so that I know why I can't register.
3. As a requester, I want the form split into short steps (You → Device → Problem & photos → Review), so that it never feels long.
4. As a requester, I want to enter my university ID in the format printed on my card (letters then digits, e.g. CS383833) in any case, so that typos are caught before pickup day.
5. As a requester, I want to type my phone as 061…, 61… or +252…, so that I don't have to know the international format.
6. As a requester, I want to choose Student, Lecturer or Staff, so that the desk knows who I am.
7. As a returning requester, I want my updated phone or faculty to replace my old details, so that staff contact the right number.
8. As a requester, I want to pick my device type, brand, OS, RAM, storage type and age from simple choices with a "Don't know" option, so that I can answer even if I'm not technical.
9. As a requester, I want a short hint on where to find my model and specs, so that I can fill them in correctly.
10. As a requester, I want to list the accessories I'm leaving (charger, bag, mouse), so that I get them back.
11. As a requester, I want to pick one or more problem categories, so that I don't have to describe everything in words.
12. As a requester, I want follow-up questions only for the categories I picked, so that I answer only what matters.
13. As a requester, I want to say when the problem started and whether the device was dropped, got wet or was updated, so that the technician finds the cause faster.
14. As a requester, I want to type the error message I see, so that the technician can look it up.
15. As a requester, I want to add up to 3 photos (the problem, the error screen, the model sticker), so that the technician sees what I see.
16. As a requester, I want my photos kept private, so that strangers can't see my device or screen.
17. As a requester, I want to say whether the technician will need my password, without typing it on the website, so that my password stays safe.
18. As a requester, I want to optionally allow a Windows reinstall if needed, so that my repair isn't stalled waiting for my permission.
19. As a requester, I want to review everything and accept the backup / liability / end-of-event policy in one checkbox, so that I know the rules.
20. As a requester, I want to be stopped if I already have an open request for the same device, and be shown that code, so that I don't create duplicates.
21. As a requester, I want a short, random tracking code on screen after submitting, so that I can follow my repair.
22. As a requester, I want to receive a WhatsApp message with my code and the venue, so that I don't lose it.

### Requester — tracking and after
23. As a requester, I want to enter my code and see the status, timeline and device, so that I know where my repair stands.
24. As a requester, I want to see the WhatsApp number of my assigned technician, or of the event desk before assignment, so that I can ask questions.
25. As a requester, I want to see a clear "Action needed" status with what I must do, so that my repair isn't stuck because of me.
26. As a requester, I want to see "Waiting for parts" with the part I must buy, so that I can bring it.
27. As a requester, I want to see "Ready for pickup" with the venue and hours, so that I know where and when to collect.
28. As a requester, I want to see "Cannot be repaired" with the reason, so that I can decide what to do next.
29. As a requester, I want my full name and university ID never shown on the tracking page, so that my identity is protected.
30. As a requester, I want to recover my codes with my university ID and the last 4 digits of my phone, so that a lost code isn't a lost device.
31. As a requester, I want to cancel my request before I drop the device off by re-entering my university ID, so that the queue stays accurate.
32. As a requester, I want any friend carrying my ID card to be able to collect my device, so that I don't have to come myself.
33. As a requester, I want to rate the service 1–5 with an optional comment after collection, so that the team improves.
34. As a requester, I want WhatsApp messages in Somali and English, so that I understand them.

### Lead technician
35. As a lead, I want a board with columns Waiting drop-off, To assign, In repair, Blocked, Ready for pickup and Collected today, so that I see the whole event at a glance.
36. As a lead, I want the board to refresh every 30 seconds, so that I always see the current state.
37. As a lead, I want cards to turn to a "stuck" style when received and unassigned for over 1 hour or in repair for over 1 day, so that nothing is forgotten.
38. As a lead, I want each card to show the tag number large, plus device, category, age, technician and priority, so that I can scan quickly.
39. As a lead, I want to search by tracking code, tag number, university ID or name, so that I find any device in seconds.
40. As a lead, I want to register a walk-in requester at the desk with a compact version of the form, so that peak queues move faster.
41. As a lead, I want to check a device in by finding it, checking the ID card, and recording condition, accessories and optional damage photos, so that pickup disputes are settled.
42. As a lead, I want the system to give the device the next tag number (#001…) at check-in, so that I can write it on a sticker with the first name.
43. As a lead, I want to record an optional zone letter at check-in and on each move, so that anyone can find the device.
44. As a lead, I want to mark a ticket Urgent at check-in, so that thesis or exam laptops go first.
45. As a lead, I want to enter the requester's device password at check-in, stored encrypted and shown only to the assigned technician, so that no password is written on paper.
46. As a lead, I want to assign or reassign a technician while seeing each one's open load and skill tags, so that work is spread well.
47. As a lead, I want reassignment to require a short reason, so that the history is clear.
48. As a lead, I want to assign beyond a technician's claim cap, so that I can handle exceptions.
49. As a lead, I want to confirm or reject a technician's "cannot be repaired" proposal, so that no student is told wrongly.
50. As a lead, I want a pickup screen where I search by university ID, see that person's ready devices, check the tag, tick returned accessories and enter the collector's name and phone, so that the right device goes to the right person and we know who took it.
51. As a lead, I want the stored password deleted automatically at pickup, so that we don't keep it.
52. As a lead, I want to undo the last check-in, assignment or status change with a reason, so that mistakes don't corrupt the data.
53. As a lead, I want a one-tap "Send on WhatsApp" for the Registered message, so that every requester gets their code.
54. As a lead, I want, on the last day, to move all ready-but-uncollected devices to "IT office" and send a reminder, so that the hold policy is applied in one step.
55. As a lead, I want, on the last day, to close all unfinished tickets as "Cannot be repaired – event ended", so that every ticket ends with a clear outcome.
56. As a lead, I want to see today's numbers and per-technician throughput, so that I can steer the team.
57. As a lead, I want to assign tickets to myself and use the technician workspace, so that I can repair too.

### Technician
58. As a technician, I want a phone-first workspace with a large tag number and large buttons, so that I can use it at the bench.
59. As a technician, I want tabs My tickets, Pool and Done today, so that I know what to do next.
60. As a technician, I want to claim tickets from the pool, up to 3 in repair at once, so that I don't wait for the lead.
61. As a technician, I want my tickets ordered Urgent first, then oldest, so that I work on the right one.
62. As a technician, I want to see the specs, problem categories, follow-up answers, error message, requester photos, check-in condition, damage photos and accessories, so that I know the device before I open it.
63. As a technician, I want to see the requester's password only for tickets assigned to me, so that I can log in.
64. As a technician, I want to know whether the requester allowed a Windows reinstall, so that I know if I can wipe.
65. As a technician, I want to start a repair with one tap, so that time is tracked without effort.
66. As a technician, I want to mark "Waiting for parts" with the exact part name and send the ready-made WhatsApp message, so that the student buys the right part.
67. As a technician, I want to mark "Action needed" with what I need and send the ready-made WhatsApp message, so that the student responds.
68. As a technician, I want to resume repair when the part arrives or the student responds, so that the ticket continues.
69. As a technician, I want to propose "Cannot be repaired" with a reason, so that the lead can confirm it.
70. As a technician, I want to record the actual fault and tick the actions I did before marking ready, so that the event's knowledge is captured.
71. As a technician, I want to tick a quick test checklist (boots, charges, Wi-Fi, keyboard/touchpad, screen) before marking ready, so that devices leave working.
72. As a technician, I want to send the ready-made "Ready for pickup" WhatsApp message, so that the student comes.
73. As a technician, I want to add internal notes, so that other staff understand what happened.
74. As a technician, I want to release a ticket back to the pool or ask for reassignment with a reason, so that I'm not stuck with work I can't do.
75. As a technician, I want only free or university-licensed software in the actions list, so that I don't install pirated software.

### Admin
76. As an admin, I want to create and edit an event (name, dates, venue, hours, desk WhatsApp number, hold days), so that everything public and operational follows it.
77. As an admin, I want only one active event at a time, so that tickets always land in the right one.
78. As an admin, I want to bulk-add volunteer technicians from a pasted list and see generated passwords once, so that setup takes minutes.
79. As an admin, I want volunteer technician accounts to deactivate automatically when the event ends, so that no stale accounts stay open.
80. As an admin, I want to re-activate staff for a new event, so that returning volunteers keep their account.
81. As an admin, I want to set skill tags on technicians, so that leads can assign well.
82. As an admin, I want a live overview during the event, so that I can step in.
83. As an admin, I want an event report (registered, received, fixed, cannot repair, collected, uncollected, fix rate, median time to ready, top faults and actions, by faculty, device type and technician, average rating, comparison with previous events), so that I can show the event's value.
84. As an admin, I want to export the report as a one-page PDF and all tickets as CSV, so that I can share them with faculty heads and IT.
85. As an admin, I want to search any ticket by code, tag or university ID and see its full timeline with who did what, so that I can resolve disputes.
86. As an admin, I want to undo a pickup with a reason, so that a mistaken release can be corrected.
87. As an admin, I want personal details erased 12 months after an event while anonymous statistics remain, so that SIMAD is protected.

### Everyone
88. As any user, I want every screen to have one obvious next action and no explaining paragraphs, so that I never hesitate.
89. As any user, I want the same status names, colours and icons everywhere, so that I learn them once.
90. As any user, I want immediate feedback on every action and one-line errors next to the field, so that I know what happened and how to fix it.
91. As any user, I want the app to work well on my phone, so that I can use it anywhere on campus.

## Implementation Decisions

### Domain model
- **Event** (new): name, start/end dates, registration open/close, venue (pickup point), hours, desk WhatsApp number, uncollected hold days, active flag. Exactly one active event. Tag-number sequence per event.
- **Requester**: university ID becomes required and unique (normalised uppercase, `^[A-Z]{1,6}[0-9]{3,10}$`), phone required and normalised to `+2526XXXXXXXX`, types Student / Lecturer / Staff (Other removed). Returning requesters matched by university ID only; contact details updated on reuse.
- **Device**: adds OS, RAM, storage type, age band; device type and brand become fixed picklists (brand with "Other" + text). The legacy staff-owner link is removed.
- **Ticket**: belongs to an Event; random tracking code `SIM-YY-XXXXXX` (6 chars from an unambiguous alphabet) replaces the sequential code and counter; tag number (unique per event, assigned at check-in); priority Normal/Urgent; problem categories (multi) + follow-up answers (structured JSON keyed by category); started-when, recent events, error message; wipe permission; needs-password flag; requester photos (up to 3); check-in condition checklist, accessories received, damage photos (up to 2), zone, encrypted password (deleted at pickup / event end); repair record (actual faults, actions, test checklist, note); blocked detail (part name / action text / cannot-repair reason); collector name + phone + accessories returned; rating + comment.
- **One lifecycle** replaces `RepairStatus` + `CustodyStatus`:

  ```
  SUBMITTED ─► RECEIVED ─► IN_REPAIR ─► READY_FOR_PICKUP ─► COLLECTED
     │            │          │  ▲  │            │
     ▼            │          ▼  │  ▼            └─(event end)─► held at IT office (location, not status)
  CANCELLED       │   WAITING_FOR_PARTS / ACTION_NEEDED
                  │          │
                  └──────────┴─► CANNOT_REPAIR_PROPOSED ─(lead confirms)─► CANNOT_BE_REPAIRED ─► COLLECTED (returned)
  ```
  Assignment is a separate field, not a status. "To assign" = RECEIVED without technician. Custody becomes data on the ticket (received by/at, zone, location Event desk / IT office, released by/at), not a second state machine. `CANNOT_REPAIR_PROPOSED` is shown publicly as "In repair" until confirmed.
- **Ticket events** remain the append-only audit log; add types for claim, release, reassign (with reason), blocked/unblocked, cannot-repair proposed/confirmed/rejected, undo (with reason), message sent, rating.
- **Staff**: skill tags (Hardware, Software/OS, Network); technician accounts linked to the event and deactivated at event end.
- **Message log** (new): ticket, template (Registered, Action needed, Waiting for parts, Ready for pickup, Uncollected reminder), language, sent by, sent at, channel (manual WhatsApp link now; Cloud API later).
- **Rate-limit buckets** stored in the database so limits hold across server instances.

### Modules (deep modules, small interfaces)
- **Ticket workflow** — a pure module: `(ticket state, actor, action) → new state + events | rejection`. Encodes every transition, role permission, claim cap, required fields (repair record and test checklist before ready, reason for undo/reassign/cannot-repair) and the undo rules. No database access. All services call it; nothing else decides transitions.
- **Ticket service** — loads a ticket, calls the workflow, persists the result and events in one transaction. One entry point per action; the public, lead and technician route handlers become thin wrappers over it.
- **Intake** — validates and normalises the public/desk request (ID, phone, specs, categories, answers, photos, consent), duplicate check, requester matching, code generation.
- **Event service** — active event, registration window, tag allocation, end-of-event bulk actions, volunteer expiry.
- **Messaging** — builds bilingual ready-made texts from templates + event settings, returns a WhatsApp link, logs the send. Adapter interface so the Cloud API can plug in later.
- **Secrets** — encrypt/decrypt device passwords with a server key; deletion hooks at pickup and event end.
- **Photos** — private bucket; public upload with size/type limits and per-ticket caps; staff view via short-lived signed URLs.
- **Reports** — event report, comparison with previous events, PDF and CSV export.
- **Retention** — scheduled job: erase personal details of tickets whose event ended more than 12 months ago.
- **Design system** — tokens in the global stylesheet + Tailwind theme; core components (Button, Input, Select, ChoiceCard, Badge, Card, BoardColumn, Dialog/Sheet, Toast, EmptyState, Stepper, PhotoUploader, TagNumber, Timeline). Inline styles removed as each screen is rebuilt.

### API
- Public: submit request, track by code, find my requests (ID + last 4 phone digits), cancel (code + ID), rate (code), upload request photo.
- Staff: one ticket-action endpoint family (check-in, assign, claim, release, start, block, unblock, propose/confirm/reject cannot-repair, mark ready, pickup, undo, add note, log message), board/list queries, event CRUD, staff bulk add, reports and exports, audit search.
- The legacy ticket, device and lookup endpoints and pages are removed; history is read-only through audit search.

### Security
- Random codes; code-only tracking reveals status, timeline, device and contact number only.
- Honeypot field; max 3 requests per university ID per day; DB-backed IP rate limits on submit, track, find and cancel.
- Passwords encrypted at rest, visible only to the assigned technician, deleted at pickup and event end.
- Photos private; signed URLs only for staff.

### Data migration
- Existing tickets are attached to a "Legacy" event; statuses mapped to the new lifecycle; sequential codes kept as-is (still resolvable) while new tickets use random codes.

## Testing Decisions

- **Good tests check behaviour through a public interface**, never internals: given a state and an action, what state and events result; given an HTTP request, what response and stored data result. The current placeholder tests (asserting constants equal themselves) are replaced.
- **Primary seam: the ticket workflow module.** Pure and fast; table-driven tests cover every transition, every role, the claim cap, required fields, undo rules and rejection messages. This is where most tests live.
- **Second seam: service + route integration tests against a real PostgreSQL test database** (one per test run, reset between tests). They cover intake (normalisation, duplicate check, requester matching, code uniqueness), check-in through pickup, tag allocation under concurrency, rate limits, password deletion, end-of-event bulk actions and retention.
- **Pure helpers** (phone/ID normalisation, code generation, message templates, report aggregation) get unit tests.
- **E2E (Playwright)**: one happy path per role — requester submits and tracks; lead checks in, assigns, hands over; technician claims and marks ready; admin creates an event and exports a report. Prior art: the existing Playwright setup and the auth-role spec.

## Out of Scope

- WhatsApp Cloud API automatic sending (adapter only; manual links now).
- SMS and email notifications.
- Parts inventory and payments (students buy parts themselves).
- Barcode/QR scanning and label printing (hand-written stickers).
- Year-round walk-in operation outside events.
- Requester accounts and logins.
- Somali translation of the website (WhatsApp messages only).
- Admin-editable category, accessory and action lists (fixed in code for v1).
- Native mobile apps; AI classification.

## Further Notes

- Licence list for "university-licensed software" to be supplied by SIMAD IT (TD5).
- Derived colour tokens (green-700, green-900) need confirmation from the design system owner.
- The README still describes "FarsamoTech Repair Hub" and links missing docs; refresh it with Milestone 1.
