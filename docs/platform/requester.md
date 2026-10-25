# Requester (public, no account)

Status: **agreed (3 rounds of grilling)**. Section 1 is how the code works today, section 2 the problems found, section 3 the agreed design.

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

## 3. Agreed design

### 3.1 Journey

```
1. Request   → multi-step form: You → Device → Problem & photos → Review & consent
2. Confirm   → code on screen; lead sends ready-made WhatsApp "Registered" message
3. Drop-off  → desk checks in at the event venue
4. Repair    → tracking page shows status + technician WhatsApp; "Action needed" message if blocked
5. Ready     → technician sends "Ready for pickup" WhatsApp
6. Collect   → anyone with the owner's university ID card; desk checks ID, records collector
7. Feedback  → 1–5 rating on the tracking page
```

### 3.2 Requester details (step 1)
- University ID **required**, letters + digits (e.g. `CS383833`): trimmed, upper-cased, validated as `^[A-Z]{1,6}[0-9]{3,10}$`.
- Type: Student / Lecturer / Staff. Full name, faculty, department.
- Phone **required**, Somali mobile, stored as `+2526XXXXXXXX`.

### 3.3 Device information (step 2) — the technician's starting point
| Field | Input | Why |
| --- | --- | --- |
| Device type | Laptop / Desktop / All-in-one / Tablet / Other | grouping, reports |
| Brand | picklist (HP, Dell, Lenovo, Acer, Asus, Apple, Toshiba, Other) + free text | |
| Model | free text, with hint "on the sticker under the laptop" | |
| Operating system | Windows 11 / 10 / 7-8 / macOS / Linux / Don't know | most fixes are OS-specific |
| RAM | 2 / 4 / 8 / 16+ GB / Don't know | "slow" diagnosis |
| Storage | HDD / SSD / Don't know (+ size optional) | "slow" diagnosis, upgrade advice |
| Age | < 1 yr / 1–3 / 3–5 / 5+ | |
| Serial number | optional | identification at pickup |
| Accessories left with device | checkboxes: charger, bag, mouse, other | disputes at pickup |

Help text links to "How to find your specs" (Windows: Settings → System → About).

### 3.4 Problem & photos (step 3) — structured diagnosis
- **Problem categories** (multi-select): Slow / virus, Won't turn on, Screen, Keyboard / touchpad, Battery / charging, Windows / software install, Wi-Fi / network, Other.
- **Follow-up questions per category** (only shown when picked), e.g.
  - Won't turn on → Any lights? Any sound? Did it get wet or fall?
  - Screen → Cracked? Lines/flicker? Black but running?
  - Slow / virus → Pop-ups? Since when? Antivirus installed?
  - Software install → Which software? Need licence?
- **When did it start?** Today / This week / This month / Longer.
- **Recent events** (multi-select): dropped, liquid spill, Windows update, new software, none.
- **Error message**: free text.
- **Description**: free text, 10–2000 chars.
- **Photos: up to 3** (JPEG/PNG/WebP, ≤ 5 MB, resized on the client). Suggested shots: the problem, the error screen, the model/serial sticker. Stored in a **private** Supabase bucket; staff view via short-lived signed URLs. Never shown on the public tracking page.
- **Password handling**: "Will the technician need your password?" Yes → requester gives it **in person at drop-off**; it is never typed into the website.

### 3.5 Review & consent (step 4)
Summary of everything + one required checkbox: data backed up, SIMAD IT not liable for data loss, end-of-event policy (values from Event settings).

### 3.6 Tracking, recovery, cancel
- Code alone shows status, timeline, device, contact number (D8). Never full name or university ID.
- **Find my request**: university ID + last 4 phone digits → list of open requests.
- **Cancel** before drop-off: re-enter university ID.
- After collection: 1–5 rating + comment.

### 3.7 Protection
Random codes; honeypot; max 3 requests/day per university ID; IP rate limit stored in the database (works across server instances); duplicate check (same ID + device type + brand open → blocked with the existing code).

### 3.8 Language
Website English; WhatsApp ready-made messages Somali + English.

### 3.9 Build slices (in order)
1. **Lock down**: random codes, tracking page cleanup, delete `/lookup`, DB rate limit, honeypot, duplicate check.
2. **Event settings** + closed page + venue/desk number used everywhere.
3. **New intake form**: ID/phone validation, device info, diagnosis questions, consent, photos.
4. **WhatsApp ready-made messages** + send log; WhatsApp Cloud API adapter later.
5. **Outcomes**: Waiting for parts, Action needed, Cannot be repaired, Cancelled.
6. **Find my request, cancel, rating.**

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
| D14 | University ID = letters + digits (e.g. `CS383833`). | 3 |
| D15 | **Device information and photos are top priority**: structured specs, per-category diagnosis questions, up to 3 photos (private storage). Reverses the earlier "no photos" suggestion. | 3 |
| D16 | Accepted as recommended: phone normalisation, match by ID only, code-only tracking, Find my request, cancel before drop-off, duplicate check, category lists, consent, English site + bilingual WhatsApp, spam protection, rating. | 3 |
