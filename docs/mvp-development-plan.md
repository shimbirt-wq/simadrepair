# MVP Development Plan - SIMADRepair Cleanup-First Workflow

Date: 2026-06-26
Target: Ship tomorrow with a clean, minimal, professional repair workflow.

## Final Decision

We will not keep the old complex workflow for later. The MVP removes diagnosis stages, quality inspection, required notes, student action forms, parts workflow, system notifications, and complex reporting.

The product will work like this:

1. Requester submits a repair request.
2. Requester receives a tracking code immediately.
3. Request appears in Lead Command Center.
4. Lead searches by tracking code, name, university ID, or phone.
5. If the laptop has not arrived, it stays `Not received`.
6. When the laptop arrives, lead marks it `Received`.
7. Lead assigns a technician.
8. Public tracking shows the assigned technician contact.
9. Technician marks `In repair`.
10. Technician marks `Ready for pickup`.
11. Lead or technician sends a WhatsApp pickup message.
12. Requester collects laptop.
13. Lead or technician marks `Collected`.

## Visible Statuses

Only these statuses should appear in the product UI:

| Display status | Internal status |
| --- | --- |
| Submitted | `REGISTRATION_COMPLETED` |
| Not received | `REGISTRATION_COMPLETED` + custody `NOT_RECEIVED` |
| Received | `DEVICE_RECEIVED` + custody `RECEIVED` |
| Assigned | `DEVICE_RECEIVED` + `technicianId` set |
| In repair | `REPAIR_IN_PROGRESS` |
| Ready for pickup | `READY_FOR_COLLECTION` |
| Collected | `DEVICE_COLLECTED` |

## What We Remove

### DB Schema

Remove from `RepairStatus`:

- `DIAGNOSIS_IN_PROGRESS`
- `QUALITY_INSPECTION`

Remove from `RepairTicket`:

- `severity`
- `repairMethod`
- `issueCategory`
- `triageNotes`
- `triagedById`
- `triagedAt`
- `studentActionRequired`
- `partRequirement`

Remove from `DeviceCustody`:

- `screenCondition`
- `keyboardCondition`
- `batteryCondition`
- `bodyCondition`
- `checkInPhotoUrls`
- `accessories`

Delete models:

- `TechnicianActivity`
- `RepairLog`
- `Notification`

Remove from `RepairEventType`:

- `TRIAGE_UPDATED`
- `STUDENT_ACTION_REQUESTED`
- `PART_REQUIREMENT_ADDED`

Delete enums:

- `NotificationEventType`
- `NotificationChannel`
- `NotificationStatus`

### Files To Delete

- `src/lib/service-desk/lead-triage.ts`
- `src/lib/service-desk/notifications.ts`
- `src/lib/service-desk/notification-templates.ts`
- `src/lib/service-desk/service-desk-reports.ts`
- `src/app/api/admin/service-desk/`
- `src/app/api/lead/tickets/[ticketId]/triage/route.ts`
- `src/app/api/notifications/`
- `src/app/api/technician/workspace/tickets/[ticketId]/notes/route.ts`
- `src/app/api/technician/workspace/tickets/[ticketId]/request-student-action/route.ts`
- `src/app/api/technician/workspace/tickets/[ticketId]/submit-quality-check/route.ts`
- `src/components/service-desk/device-check-in-form.tsx`
- `src/components/service-desk/custody-status-form.tsx`
- `src/components/service-desk/pickup-confirmation-form.tsx`
- `src/components/service-desk/lead-triage-form.tsx`
- `src/components/service-desk/lead-assignment-form.tsx`
- `src/components/service-desk/lead-ticket-detail.tsx`
- `src/components/service-desk/technician-ticket-detail.tsx`
- `src/components/service-desk/technician-repair-note-form.tsx`
- `src/components/service-desk/technician-status-form.tsx`
- `src/components/service-desk/technician-student-action-form.tsx`
- `src/components/service-desk/device-custody-panel.tsx`
- `src/components/service-desk/service-desk-reports.tsx`

### Files To Rewrite Or Simplify

- `prisma/schema.prisma`
- `src/lib/service-desk/public-requests.ts`
- `src/lib/service-desk/public-tracking.ts`
- `src/lib/service-desk/workflow.ts`
- `src/lib/service-desk/validations.ts`
- `src/lib/service-desk/constants.ts`
- `src/lib/service-desk/technician-workspace.ts`
- `src/lib/service-desk/device-custody.ts`
- `src/lib/dashboard/dashboard-service.ts`
- `src/components/service-desk/lead-command-center.tsx`
- `src/components/service-desk/technician-workspace.tsx`
- `src/components/service-desk/public-repair-request-form.tsx`
- `src/components/service-desk/public-tracking.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/repair-tickets/page.tsx`
- `src/app/profile/page.tsx`

## Backend MVP Services

Lead workflow:

- list queue
- search tickets
- mark device received
- assign technician
- mark collected
- list technicians

Technician workflow:

- list assigned tickets
- get assigned ticket detail
- mark in repair
- mark ready for pickup

Public tracking:

- show tracking code
- show simple display status
- show requester/device summary
- show assigned technician name and phone after assignment
- show pickup location when ready

WhatsApp:

- no notification table
- no automatic notification engine
- use manual `https://wa.me/` link with prefilled pickup message

## WhatsApp Pickup Message

```text
Hello {requesterName}, your computer repair is ready for pickup. Please come to {serviceLocation} and bring your tracking code {trackingCode}. Thank you.
```

Default service location:

```text
IT Services Desk
```

## Implementation Order

1. Simplify Prisma schema.
2. Add migration SQL.
3. Generate Prisma client.
4. Delete obsolete routes, services, components, and tests.
5. Rewrite service-desk constants, validations, and workflow helpers.
6. Rewrite public request creation and public tracking.
7. Rewrite lead command center service/API/UI.
8. Rewrite technician service/API/UI.
9. Simplify dashboards and profile/notification UI.
10. Run typecheck, tests, e2e, and build.

## Validation Commands

```text
npm run -s typecheck
npm run -s test
npm run -s test:e2e
npm run -s build
```
