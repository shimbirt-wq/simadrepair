# Requester (public, no account)

Status: **draft — being grilled**. Section 1 is how the code works today. Section 3 is a proposal, not decided.

---

## 1. How it works today

### 1.1 Journey

```
Landing page ──► /request-repair ──► success modal (tracking code) ──► walks in with device
                                                                          │
               /track?code=SIM-2026-000123 ◄──────────────────────────────┘ (checks any time)
                        │
                        └─► "Ready for pickup" → WhatsApp the technician → collects device
```

### 1.2 Submitting a request — `/request-repair`

UI: `src/components/service-desk/public-repair-request-form.tsx` (one long form).
API: `POST /api/public/repair-requests` → `createPublicRepairRequest()` in `src/lib/service-desk/public-requests.ts`.

| Field | Required | Rule (`src/lib/service-desk/validations.ts`) |
| --- | --- | --- |
| Full name | yes | 2–120 chars |
| Requester type | yes | Student / Lecturer / Staff / Other |
| University ID | no | ≤ 60, no format check |
| Phone | yes | 7–30 chars, no format check |
| Faculty, Department | no | free text |
| Email | no | valid email |
| Device type, Brand, Model | yes | free text, ≥ 2 chars |
| Serial number, Asset tag | no | |
| Issue description | yes | 10–2000 chars |

In one database transaction:
1. **Find or create the requester.** Reuse if exactly one existing requester has the same university ID, or (if no ID given) the same phone. Otherwise create a new one. The submitted name/faculty are *not* saved onto a reused record.
2. Create a new `Device` every time (never reused).
3. Allocate a tracking code `SIM-<year>-<6-digit sequence>` from `TrackingCodeCounter`.
4. Create the `RepairTicket` (`REGISTRATION_COMPLETED`), its `DeviceCustody` (`NOT_RECEIVED`), and a `TICKET_CREATED` event.

Success modal shows the code with a Copy button and a warning: *"Take a screenshot… The code will not be sent to you by SMS or email unless you provided a contact."*

### 1.3 Tracking — `/track`

UI: `src/components/service-desk/public-tracking.tsx`. API: `GET /api/public/tracking/[code]` → `src/lib/service-desk/public-tracking.ts`. Rate limit 20 lookups/min per IP.

Anyone with the code sees: status, **first name**, device type/brand/model, **assigned technician's full name and phone**, custody status, **storage location**, and the full event timeline. When ready, it says "come to *<storage location>*" and shows **"Contact technician on WhatsApp"** (a `wa.me` link to the technician's personal number).

### 1.4 Legacy lookup — `/lookup/[ticketId]`

`src/lib/lookup/ticket-lookup-service.ts`. Only accepts `TCK-…` IDs, so it **never matches** a ticket created by the current public form (`SIM-…`). It also builds QR codes through a third-party site (`api.qrserver.com`). Dead code.

### 1.5 After collection

Nothing. No receipt, no feedback, no way to reopen.

---

## 2. Problems (senior review)

Ranked by risk.

### Security & privacy
| # | Problem | Why it matters |
| --- | --- | --- |
| P1 | **Tracking codes are sequential.** `SIM-2026-000001`, `…002`, … | Anyone can walk the whole list and read every requester's first name, device, and the technician's phone. The 20/min limit slows this to ~29k/day per IP — that's not a barrier. |
| P2 | **Pickup isn't verified.** `pickupCodeHash` exists but is always `null`; staff just type the collector's name. | Whoever knows (or guesses, see P1) a code and shows up when it's "Ready" can walk off with a laptop. This is the biggest real-world risk. |
| P3 | **Technician personal phone is public**, and the page tells students to WhatsApp them. | Leaks staff numbers, bypasses the desk, contradicts the faculty doc ("students disturbing technicians"). |
| P4 | **Internal storage location is public** and doubles as the pickup place. | "Shelf B3, cabinet 2" tells a thief where the device is. Storage location and pickup point are different things. |
| P5 | **Submit endpoint has no rate limit or bot protection.** | A script can create thousands of fake tickets and fill the queue. |
| P6 | **Rate limiter is in-memory per server instance**, keyed by `x-forwarded-for` (spoofable). | On Vercel each instance has its own memory, so the limit barely applies. |

### Correctness & data quality
| # | Problem |
| --- | --- |
| P7 | Requester matching by phone merges different people who share a phone; a reused record keeps the old name/faculty. |
| P8 | Phone and university ID have no format check — can't send SMS reliably, can't match reliably. |
| P9 | Device type / brand are free text → reports can't group "laptop", "Laptop", "lap top". |
| P10 | Duplicate requests: same person, same device, open ticket → nothing stops a second one. |
| P11 | Misleading copy: "won't be sent unless you provided a contact" — nothing is ever sent. |

### Experience gaps
| # | Problem |
| --- | --- |
| P12 | **Lost the code = lost.** No recovery. |
| P13 | **No notifications.** The requester must keep checking `/track`. |
| P14 | No outcome other than success: no "can't repair", "waiting for parts", "need your password/permission", "cancelled". |
| P15 | No drop-off instructions (where, hours, what to bring, back up your data). No consent to terms (data loss liability, abandoned devices). |
| P16 | No photo, no issue category — technicians start with only free text. |
| P17 | English only. |

---

## 3. Proposal — a professional requester experience

### 3.1 Principles
- **No account, still secure.** The tracking code is a *reference*, not a key. Seeing personal details or collecting a device needs a second factor the requester has (their phone).
- **The desk is the single point of contact.** Requesters never get staff personal numbers.
- **Push, don't make them poll.** Send messages at the moments that matter.
- **Every ticket ends with a clear outcome.**

### 3.2 The new journey

```
1. Request   → short multi-step form (who → device → problem → review & consent)
2. Confirm   → code on screen + SMS/WhatsApp: "SIM-2026-K7P3QX received. Bring device to <desk>, <hours>."
3. Drop-off  → desk checks in; requester gets "Device received" message
4. Repair    → status updates; if the tech needs something: "Action needed" message
5. Ready     → message with a 6-digit PICKUP CODE (never shown on the website)
6. Collect   → requester gives pickup code (or shows ID); desk verifies → "Collected" receipt
7. Feedback  → one-tap rating link
```

### 3.3 Changes, grouped into shippable slices

| Slice | What | Fixes |
| --- | --- | --- |
| **A. Lock down tracking** | Random, non-sequential codes (e.g. `SIM-26-K7P3QX`, no 0/O/1/I). Public page shows status + timeline only. Details (device, name) need code + last 4 digits of phone. Remove technician phone/WhatsApp; show a public *pickup point* instead of storage location. Delete `/lookup`. | P1, P3, P4 |
| **B. Verified pickup** | On "Ready", generate a 6-digit pickup code, store only the hash in `pickupCodeHash`, send it to the requester. Desk must enter it to release the device; fallback = ID check with reason logged. | P2 |
| **C. Abuse protection** | Durable rate limit (DB table or Upstash) on submit + tracking; honeypot field; per-phone cap on open tickets. | P5, P6, P10 |
| **D. Better intake** | Multi-step form; phone normalized to `+252…`; device type & issue category as picklists; optional photo; drop-off instructions; consent checkbox (backup your data, abandoned-device policy). | P8, P9, P15, P16 |
| **E. Notifications** | `Notification` outbox table + provider adapter (SMS first; WhatsApp later). Events: submitted, received, action needed, ready (+pickup code), collected. | P11, P13 |
| **F. Recovery** | "Find my request": university ID or phone → sends active codes by SMS. Never displays them on screen. | P12 |
| **G. Outcomes** | Requester-visible states: *Waiting for parts*, *Action needed*, *Cannot be repaired*, *Cancelled*. Requester can cancel before drop-off. | P14 |
| **H. Matching** | Match by university ID only; phone match never merges; update contact info on reuse. | P7 |
| **I. Feedback & language** | Post-collection rating; Somali + English. | P17 |

Suggested order: **A → B → C** (security first, small), then **E** (unlocks B's code delivery and F), then **D, G, F, H, I**.

---

## 4. Decisions log

| # | Decision | Round |
| --- | --- | --- |
| D1 | **WhatsApp is the channel.** Now: staff send ready-made messages (pre-filled `wa.me` links from the platform). In parallel: WhatsApp Cloud API, behind one notification module so the switch is invisible to the rest of the code. | 1 |
| D2 | **Public tracking shows the assigned technician's phone number.** | 1 |
| D3 | **Pickup = the requester's registered university ID.** No pickup codes. Staff check the ID card against the ID on the ticket. | 1 |
| D4 | **Main focus is Computer Maintenance Week only.** Year-round walk-in is not a goal for now. | 1 |
| D5 | **University ID is required** for every requester; everyone has one. Requester types: Student, Lecturer, Staff ("Other" removed). | 2 |
| D6 | **No requester accounts.** Tracking code + university ID is enough. | 2 |
| D7 | **New outcomes:** Waiting for parts, Action needed from you, Cannot be repaired, Cancelled. | 2 |
| D8 | **Contact number shown:** assigned technician's WhatsApp once assigned; the event desk number before that. | 2 |
| D9 | **Ready-made WhatsApp messages v1:** Registered (lead sends), Action needed and Ready for pickup (technician sends). Every send is logged on the ticket. | 2 |
| D10 | **Pickup by anyone carrying the owner's ID card.** Collector's name and phone are recorded. | 2 |
| D11 | **End of week:** fixed-but-uncollected → IT office for 30 days + WhatsApp reminder, then abandoned-property policy. Unfinished → returned as "Cannot be repaired – event ended". Requester agrees on the form. | 2 |
| D12 | **Random tracking codes** that can't be guessed (e.g. `SIM-26-K7P3QX`). | 2 |
| D13 | **Event settings** (admin, once per event): name, dates, venue/pickup point, hours, desk WhatsApp number. The form is open only during the event window; otherwise a "closed — next event soon" page. | 2 |
