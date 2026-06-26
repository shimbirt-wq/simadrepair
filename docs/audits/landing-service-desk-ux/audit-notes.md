# FarsamoTech Landing And Dashboard UX Audit

Date: 2026-06-25

## Evidence

- Verified screenshot: `docs/audits/landing-service-desk-ux/01-home.png`
- DOM snapshots: `02-request-repair.dom.txt`, `03-track.dom.txt`, `04-login.dom.txt`
- Source reviewed: landing components, public request/track/login pages, app shell, role dashboards, service-desk components, Prisma schema, notification services, project definition.
- Limitation: Chrome and bundled headless Chromium timed out or failed for additional screenshots after the home capture. The remaining public pages were audited from DOM snapshots and source. Authenticated dashboards were audited from code because they require a live authenticated database session.

## Executive Summary

The product is not a generic education platform or broad productivity SaaS. It is a focused SIMAD IT service desk for computer repair operations. The strongest product story is:

Public requester submits without an account -> receives a tracking code -> lead technician triages -> technician works assigned queue -> device custody is tracked -> requester tracks safe public status -> pickup is confirmed.

The current landing page mostly points in the right direction, especially the hero and primary CTAs. The main weakness is credibility. Several public proof claims are hard-coded, some footer links point to sections that do not exist, social/profile links are placeholders, and some copy implies maturity that the backend does not prove. The dashboard/navigation structure also mixes newer service-desk V2 modules with older owner-backed device/ticket pages, which can confuse staff and hide the real operational workflow.

## What Is Working

- The hero says the real product category clearly: "campus repair request" and "trusted service desk" in `src/components/landing/hero.tsx:322`.
- Primary public actions are correct: submit request first, track request second in `src/components/landing/hero.tsx:334` and `src/components/landing/hero.tsx:341`.
- Public request intake is real and no-login, backed by `src/app/request-repair/page.tsx:25` and `src/components/service-desk/public-repair-request-form.tsx:342`.
- Public tracking is real, privacy-limited, and code-based, backed by `src/app/track/page.tsx:42` and `src/lib/service-desk/public-tracking.ts:100`.
- Staff-only login copy is accurate: `src/app/auth/login/login-form.tsx:62` says staff workspace access and routes students/lecturers to public flows.
- The backend supports a meaningful service-desk model: internal roles, repair statuses, requesters, devices, tickets, custody records, events, and notifications in `prisma/schema.prisma:11`, `prisma/schema.prisma:17`, `prisma/schema.prisma:129`, `prisma/schema.prisma:177`, `prisma/schema.prisma:247`, and `prisma/schema.prisma:324`.
- Lead and technician workspaces exist: `src/components/service-desk/lead-command-center.tsx:257` and `src/components/service-desk/technician-workspace.tsx:233`.
- Admin/lead reporting exists: `src/components/service-desk/service-desk-reports.tsx:238`.

## Critical Issues

1. Public proof is not trustworthy yet.
   - The hero and stats strip claim "15,000+", "5,800+", and "98.6%" in `src/components/landing/hero.tsx:38` and `src/components/landing/stats-strip-section.tsx:9`.
   - I did not find a data-backed source for these numbers in the reviewed code.
   - Recommendation: remove them or label them as live metrics only after they are backed by reporting queries.

2. Some copy overstates security/integration maturity.
   - "Enterprise-grade security and privacy" appears in `src/components/landing/hero.tsx:131`.
   - The app has role-based access, session auth, and privacy-limited public tracking, but "enterprise-grade" is a high-trust claim that needs audits, controls, SLAs, or compliance evidence.
   - Recommendation: replace with "Role-based staff access and privacy-limited public tracking."

3. WhatsApp is target strategy, not current delivery.
   - The product definition correctly says WhatsApp should be primary in `docs/PROJECT_DEFINITION.md:51` and `docs/PROJECT_DEFINITION.md:225`.
   - The current notification default is dashboard-only in `src/lib/service-desk/notifications.ts:57`, and the provider falls back to a local stub in `src/lib/service-desk/notification-providers.ts:24`.
   - Recommendation: do not market WhatsApp updates until a real provider is configured and monitored. Use "notification-ready workflow" for now.

4. Footer links undermine trust.
   - Footer links point to `/#it-policies`, `/#guidelines`, `/#announcements`, `/#status`, `/#faq`, and `/#guidelines` in `src/components/landing/footer.tsx:14` and `src/components/landing/footer.tsx:23`, but the landing page does not render matching sections.
   - Recommendation: remove dead links now. Keep only Home, Services, Workflow, Team, Contact, Submit Request, Track Request, Staff Login.

5. Placeholder social links look unfinished.
   - Team and footer social links use generic social domains rather than real profiles in `src/components/landing/footer.tsx:28` and `src/components/landing/hero.tsx:513`.
   - Recommendation: remove until real links exist, or link only official SIMAD/FarsamoTech channels.

6. The dashboard IA mixes V2 service desk with legacy owner-backed ticket/device pages.
   - Public V2 requests create `Requester`-backed devices/tickets, but some internal pages assume `ownerId` user-backed devices. `src/lib/devices/device-service.ts:89` throws if a device has no owner, and `src/lib/repair-tickets/repair-ticket-service.ts:372` filters admin/lead ticket lists to owner-backed devices only.
   - That means `/repair-tickets` and `/devices` can miss the public-request tickets that are central to the landing story.
   - Recommendation: either retire/rename those legacy pages or make them service-desk aware.

## Product Capability Match

Supported today:

- Public request submission without account.
- Tracking code generation and public tracking lookup.
- Staff login for admin, lead technician, technician.
- Lead triage, severity, repair method, technician assignment, custody workflow.
- Technician assigned queue, notes, status updates, student action requests, quality submission.
- Device custody status, storage location, pickup confirmation fields.
- Admin/lead operational reports: totals, open/closed, waiting student, ready pickup, waiting parts, in custody, overdue pickup, faculty/category mix, technician workload, custody exceptions.
- Dashboard notification records and local notification sending.

Not proven or not fully production-backed in the reviewed code:

- Live WhatsApp/SMS/email delivery.
- Real external integrations.
- "Enterprise-grade" security posture.
- Public proof metrics such as 15,000 requests resolved.
- A student portal. The project definition explicitly says the product is no longer a traditional student portal in `docs/PROJECT_DEFINITION.md:15`.
- Complete public photo upload inside the request form. Upload routes exist, but the public request form reviewed does not expose a photo field.

## Landing Page Accuracy

Hero clarity: good. The headline and supporting paragraph match the V2 direction.

Value proposition: mostly believable, but should be more concrete. "Bring request intake, device custody, technician coordination, repair tracking, and pickup readiness..." is accurate because those concepts exist in schema and service-desk code.

Overpromises:

- Hard-coded stats.
- Enterprise-grade security.
- API & Integrations as a feature card if external integrations are not shipped.
- "Satisfaction Rate" unless there is a real survey/data source.

CTA order: correct. `Submit Request` should stay primary; `Track Request` secondary; `Sign In` staff-only tertiary.

Strongest use case: public no-account repair intake plus staff operations. The landing currently spends too much early space on the engineering team before showing service modules and workflow.

## Recommended Landing Page Order

1. Header: logo, How it works, Service desk features, Track, Staff login, primary Submit request.
2. Hero: submit and track CTAs, short service-desk workflow visual.
3. Public requester flow: submit -> tracking code -> triage -> repair -> pickup.
4. Staff operations: lead command center, technician queue, custody tracking, reporting.
5. Trust/privacy: no account required, privacy-limited tracking, role-based staff access.
6. Operational proof: only real metrics from the database, or remove until real.
7. Team/about: move lower. Useful, but not the second section.
8. Support/contact footer.

Current issue: `Our Engineering Team` appears inside the hero component before the main features section in `src/components/landing/hero.tsx:458`. It is not the user's first decision need.

## Recommended Header Navigation

Best order:

- How it works
- Features
- Track
- Contact
- Staff login
- Submit request

Avoid:

- "Services" if the product is not selling multiple service categories.
- "Team" as a top-level nav item before users understand the service.
- Dead resource links.

## Recommended Dashboard Order

Lead technician:

1. Command Center
2. Dashboard
3. Ticket Queue
4. Device Custody
5. Reports
6. Profile

Reason: project definition says daily operations should be led by the lead technician, not admin dispatching (`docs/PROJECT_DEFINITION.md:164`). Current lead nav puts Dashboard first and Command Center second in `src/app/app-shell.tsx:23`.

Technician:

1. Assigned Tickets
2. My Queue summary
3. History
4. Profile

Reason: the technician's real job is assigned repair execution. The workspace already says "Assigned repair queue" in `src/components/service-desk/technician-workspace.tsx:233`.

Admin:

1. Overview
2. Reports
3. Staff
4. Devices/Custody Exceptions
5. Tickets Archive
6. Profile

Reason: admin should monitor health and manage staff, not perform daily dispatch.

## Recommended Dashboard Home Content

Lead home should show:

- New requests needing triage.
- Waiting assignment.
- Overdue/at-risk tickets.
- Waiting for device.
- Ready for pickup.
- Workload by technician.
- Primary action: "Open command center."

Technician home should show:

- Next assigned ticket.
- Blocked/waiting-for-student items.
- In diagnosis, in repair, quality check.
- Primary action: "Start next repair."

Admin home should show:

- Service health.
- Custody exceptions.
- Staff capacity.
- Open/closed trend.
- Ready pickup overdue.
- Primary action: "Review reports" or "Manage staff."

## Specific Copy Improvements

Hero headline:

- Current: "Resolve every campus repair request from one trusted service desk."
- Better: "Submit, triage, repair, and track SIMAD computer issues from one service desk."

Hero body:

- Current: "Bring request intake, device custody, technician coordination, repair tracking, and pickup readiness into one operational system..."
- Better: "Students and lecturers submit without an account. Staff triage, assign technicians, track custody, and confirm pickup from one repair workflow."

Security benefit:

- Current: "Enterprise-grade security and privacy."
- Better: "Role-based staff access and privacy-limited public tracking."

Feature card:

- Current: "API & Integrations"
- Better: "Operational APIs and health checks" if this is primarily internal API readiness.

Stats:

- Current: "15,000+ Requests Resolved", "5,800+ Devices Fixed", "98.6% Satisfaction Rate"
- Better until backed: "No account required", "Tracking code issued", "Staff-only internal notes", "Custody-ready workflow"

Footer:

- Current: "Your campus IT partner for smarter support, faster service, and better digital care."
- Better: "SIMAD computer maintenance requests, tracking, technician workflows, and pickup coordination in one service desk."

## UX And Design Improvements

- Move team section below features/workflow. The current home screenshot shows the team before the main service feature grid, which delays product understanding.
- Reduce repeated stats. The hero and stats strip repeat similar claims.
- Replace generic benefit labels like "Lightning Fast" with operationally specific proof: "No-account intake", "Tracking code lookup", "Custody accountability".
- Make the workflow visual match actual backend statuses. The current visual is strong, but labels should align with statuses such as Registration Completed, Device Received, Diagnosis, Repair, Quality Inspection, Ready for Collection, Device Collected.
- Remove decorative social links unless real.
- Tighten landing typography. The negative letter-spacing and very heavy font weights look polished in the home screenshot, but the page risks feeling over-marketed for an operational university tool.
- Keep the product name consistent. README says "FarsamoTech Repair Hub"; docs say "FarsamoTech V2: SIMAD IT Service Desk"; UI says "SIMADRepair". Pick one primary public brand and one product descriptor.

## Accessibility And Usability Risks

Confirmed strengths:

- Public request fields have visible labels in the DOM snapshot.
- Track page has a clear tracking code input, error states in code, and privacy note.
- Global focus-visible styling exists in `src/app/globals.css`.
- Buttons and links have readable visible labels.

Risks:

- Mobile menu uses an `aside` with `aria-label`, but it is not a modal dialog, does not expose `aria-modal`, and does not appear to trap focus in `src/components/landing/mobile-menu.tsx`.
- Footer has low-contrast small slate text on dark background in the screenshot. Needs contrast verification.
- Some pale blue uppercase text and small labels may be weak on lower-quality displays.
- Dead anchor links create keyboard and screen-reader dead ends.
- Request form validation errors are client-side visible, but fields do not set `aria-invalid` or `aria-describedby` for error text.
- The login page must not expose bootstrap credentials. Keep admin bootstrap details in the seed output or deployment runbook only.

## Priority Roadmap

Fix now:

- Remove or replace hard-coded public stats.
- Replace "enterprise-grade security" with supported wording.
- Remove dead footer links and placeholder social links.
- Move team section below product/workflow content.
- Change "API & Integrations" to a supported feature label or remove.
- Rename/reorder lead and technician nav so real workspaces come first.

Fix next:

- Unify legacy `/repair-tickets` and `/devices` with the V2 public-request model, or rename them as legacy/internal owner-backed tools.
- Add a proper device custody queue page if "Device Custody" is a nav item.
- Add real empty-state guidance for dashboards: what to do now, not just no data.
- Add `aria-invalid` and error associations on public form fields.
- Add mobile menu dialog semantics and focus management.

Improve later:

- Wire real WhatsApp provider and delivery monitoring before marketing WhatsApp.
- Add real operational metrics from reports to replace static stats.
- Add public FAQ only if it exists and answers repair-specific questions.
- Add mobile and tablet screenshot QA for the landing and staff dashboards.
- Add a public "what happens next" timeline after request submission.

## Audit Step List

1. Home landing page: generally healthy but credibility and order need work. Screenshot saved as `01-home.png`.
2. Request repair page: strong public intake, accurate no-login positioning. DOM evidence saved as `02-request-repair.dom.txt`.
3. Track page: strong privacy-limited lookup, should stay as second public CTA. DOM evidence saved as `03-track.dom.txt`.
4. Staff login: accurate staff-only framing, with no visible seed credential hints. DOM evidence saved as `04-login.dom.txt`.
5. Authenticated dashboards: conceptually strong, but navigation order and legacy V2 mismatch need cleanup. Audited from source.
