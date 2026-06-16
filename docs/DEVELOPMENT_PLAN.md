# Development Plan

This document defines the build order, feature specifications, implementation prompts, test expectations, security checks, scaling decisions, and manual QA gates for FarsamoTech Repair Hub.

Every feature must be completed and manually checked before the next feature begins.

## Feature Todo Roadmap

Build in this order:

1. Project foundation and test infrastructure
2. Database migrations and seed data
3. Authentication and session management
4. Role-based authorization
5. User profile and admin user management
6. Device registration and ownership
7. Repair ticket creation
8. Ticket list, detail, and ownership filtering
9. Technician assignment
10. Repair journey status transitions
11. Repair logs and audit timeline
12. Dashboard notifications
13. Role dashboards
14. Reports and analytics
15. QR code ticket lookup
16. Optional photo upload
17. Production hardening and deployment readiness

## Global Definition Of Done

Each feature is done only when:

- It follows `docs/ARCHITECTURE.md`, `docs/CONSTRAINTS.md`, `docs/PROJECT_SETUP.md`, and `docs/PROJECT_DEFINITION.md`.
- It uses strict TypeScript with no unnecessary `any`.
- Request validation exists for all user input.
- Authorization checks exist for protected operations.
- Prisma access is isolated in server-only modules or route handlers.
- Tests cover important success and failure paths.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Manual checklist for the feature is completed.
- No real secrets are committed.

## Prompt Rules For All Agents

Every implementation prompt in this document starts with this required first line:

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.
```

Agents must then:

- List affected files before implementation.
- Explain the implementation plan.
- Implement incrementally.
- Add or update tests.
- Run verification commands.
- Report manual test steps.
- Avoid unrelated refactors.
- Avoid Phase 2 features unless the feature explicitly says otherwise.

## Feature 1: Project Foundation And Test Infrastructure

### Goal

Add a reliable automated test setup for server utilities, validation logic, and route behavior.

### Scope

- Add a test framework suitable for a Next.js TypeScript project.
- Add scripts for unit tests and coverage.
- Add initial tests for existing repair status utilities and validation schemas.
- Keep the setup lightweight and compatible with the current Next.js app.

### Security Checks

- Ensure tests do not require real Supabase credentials.
- Ensure `.env` and local secrets remain ignored.
- Do not log secrets in test output.

### Scaling Decisions

- Prefer fast unit tests for domain utilities.
- Add integration tests later only for features that need route or database behavior.
- Keep test fixtures small and reusable.

### Automated Tests

- Repair status transition helper accepts only next-step transitions.
- Repair status transition helper rejects skipped or backward transitions.
- Repair ticket validation accepts valid input.
- Repair ticket validation rejects short descriptions and invalid photo URLs.

### Manual Checklist

- Run `npm run test`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm run build`.
- Confirm no test requires real database credentials.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 1: Project Foundation And Test Infrastructure.

Add a lightweight test setup for this Next.js TypeScript project. Add package scripts for running tests, then write tests for src/lib/constants/repair-status.ts and src/lib/validations/repair-ticket.ts. Keep changes focused on test infrastructure and existing utility coverage.

Before implementation, list affected files, explain the plan, and identify risks. After implementation, run npm run test, npm run typecheck, npm run lint, and npm run build. Report the results and provide the manual checklist from this feature.
```

## Feature 2: Database Migrations And Seed Data

### Goal

Prepare Prisma migrations and safe seed data for local and Supabase-backed development.

### Scope

- Validate and finalize `prisma/schema.prisma`.
- Add Prisma migration workflow.
- Add seed script for one admin, one technician, one student, one lecturer, sample devices, and sample tickets.
- Ensure seed data uses obvious non-production credentials.

### Security Checks

- Never commit real Supabase URLs or passwords.
- Hash seeded passwords.
- Keep seeded credentials documented as local-only.
- Avoid seeding sensitive personal data.

### Scaling Decisions

- Add indexes for frequent filters: role, ticket status, technician, owner, ticket ID, created date.
- Keep enums stable for status and role values.
- Use migrations instead of manual database changes.

### Automated Tests

- Prisma schema validation passes.
- Seed password hashing helper is tested if created.
- Seed data can be generated without real production secrets.

### Manual Checklist

- Add local `.env` with development database URLs.
- Run `npx prisma validate`.
- Run `npx prisma generate`.
- Run `npx prisma migrate dev`.
- Run seed command.
- Open Prisma Studio and confirm seed records exist.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 2: Database Migrations And Seed Data.

Review prisma/schema.prisma against the architecture and constraints. Add a Prisma seed workflow with local-only sample users, devices, repair tickets, logs, technician activity, and notifications. Hash seeded passwords and do not use real personal data or secrets.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for any helper logic you introduce. Run npx prisma validate, npx prisma generate, npm run test, npm run typecheck, npm run lint, and npm run build. If migration cannot run because DATABASE_URL is missing, state that clearly and provide exact manual migration steps.
```

## Feature 3: Authentication And Session Management

### Goal

Allow users to register, log in, log out, and access their authenticated profile through secure browser sessions.

### Scope

- Registration route and form.
- Login route and form.
- Logout route.
- Password hashing with bcrypt.
- JWT signing and verification.
- Secure HTTP-only cookie session.
- `GET /api/auth/me` endpoint.

### Security Checks

- Hash passwords before storage.
- Use HTTP-only cookies.
- Use `secure` cookies in production.
- Validate email, password, role, university ID, phone, faculty, and department.
- Return generic login errors.
- Never return password hashes.
- Rate limiting can be planned here and implemented in production hardening if not added now.

### Scaling Decisions

- Keep auth helpers server-only.
- Keep JWT payload minimal: user ID and role.
- Do not query large user relations for session checks.

### Automated Tests

- Registration validates required fields.
- Registration hashes password.
- Duplicate email is rejected.
- Login rejects invalid credentials.
- Login returns a session cookie for valid credentials.
- `me` route returns the authenticated user without password hash.

### Manual Checklist

- Register a student.
- Register a technician.
- Try duplicate email registration.
- Log in with valid credentials.
- Try invalid password.
- Refresh page and confirm session remains.
- Log out and confirm protected profile is no longer available.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 3: Authentication And Session Management.

Build registration, login, logout, JWT session helpers, secure HTTP-only cookie handling, and a /api/auth/me route. Use Prisma for users, bcryptjs for password hashing, jose for JWT, and zod for validation. Do not expose password hashes.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for validation, password hashing behavior, duplicate email handling, login failures, login success, and session profile response. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 4: Role-Based Authorization

### Goal

Centralize authorization rules so every protected feature can enforce role and ownership access consistently.

### Scope

- Server helper to require authenticated user.
- Server helper to require role.
- Server helper to check owner, assigned technician, or admin access for tickets.
- Shared authorization error responses.

### Security Checks

- Deny by default.
- Do not trust client-sent role values.
- Always derive user role from verified session/database.
- Prevent technicians from accessing unassigned tickets.
- Prevent students and lecturers from accessing other users' tickets.

### Scaling Decisions

- Keep authorization helpers composable.
- Avoid duplicating role checks across route handlers.
- Use narrow database selects for authorization checks.

### Automated Tests

- Unauthenticated requests are rejected.
- Student can access own resource.
- Student cannot access another user's resource.
- Technician can access assigned ticket.
- Technician cannot access unassigned ticket.
- Admin can access all protected admin resources.

### Manual Checklist

- Log in as student and access own profile.
- Try to access another user's ticket by URL.
- Log in as technician and access assigned ticket.
- Try unassigned ticket as technician.
- Log in as admin and confirm access succeeds.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 4: Role-Based Authorization.

Create server-side authorization helpers for authenticated users, role requirements, and ticket access by owner, assigned technician, or admin. Refactor any existing auth route code only where needed to reuse these helpers. Deny by default.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for unauthenticated access, role checks, ticket ownership checks, assigned technician checks, and admin override. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 5: User Profile And Admin User Management

### Goal

Let users view their own profile and let admins manage user records and roles.

### Scope

- Profile page.
- Admin user list.
- Admin user detail.
- Admin role update where safe.
- Admin activate/deactivate support if added to schema.

### Security Checks

- Users can read only their own profile unless admin.
- Admin-only routes for user listing and role management.
- Prevent removing the last admin if that logic is added.
- Never expose password hash.
- Validate all profile changes.

### Scaling Decisions

- Paginate admin user lists.
- Add search by email, university ID, and name.
- Select only fields needed by the UI.

### Automated Tests

- Profile endpoint excludes password hash.
- Non-admin cannot list all users.
- Admin can list users with pagination.
- Admin role update validates allowed roles.
- Duplicate university ID is rejected.

### Manual Checklist

- View profile as student.
- Confirm password hash is not visible in network response.
- Try user list as student and verify denial.
- View user list as admin.
- Change a user's role as admin.
- Search or paginate users if implemented.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 5: User Profile And Admin User Management.

Build profile access for the current user and admin-only user management with pagination and safe role updates. Keep route handlers thin and use server modules for Prisma queries and authorization.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for profile visibility, password hash exclusion, admin-only listing, pagination, and role update validation. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 6: Device Registration And Ownership

### Goal

Allow students and lecturers to register devices that can later be attached to repair tickets.

### Scope

- Device registration form.
- Device list for current user.
- Device detail for current user.
- Admin device lookup.
- Server validation for device type, brand, model, and optional serial number.

### Security Checks

- Users can only create devices for themselves unless admin.
- Users can only view their own devices unless admin.
- Sanitize text fields.
- Serial number is optional but must be bounded in length.

### Scaling Decisions

- Index owner ID and serial number.
- Paginate device lists.
- Keep device records separate from tickets so repair history survives multiple tickets per device.

### Automated Tests

- Valid device can be created.
- Missing required device fields are rejected.
- User cannot create device for another user.
- User cannot read another user's device.
- Admin can look up devices.

### Manual Checklist

- Create laptop device as student.
- Create desktop device as lecturer.
- Try missing brand/model.
- Confirm student sees only own devices.
- Confirm admin can find devices.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 6: Device Registration And Ownership.

Build device creation, current-user device listing, device detail, and admin device lookup. Use Prisma, zod validation, and authorization helpers. Keep serial number optional but validated.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for validation, ownership enforcement, admin access, and list pagination if implemented. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 7: Repair Ticket Creation

### Goal

Allow students and lecturers to submit repair requests for their registered devices.

### Scope

- Repair request form.
- Ticket creation route.
- Human-readable unique ticket ID generation.
- Initial status `REGISTRATION_COMPLETED`.
- Initial repair log entry.

### Security Checks

- Users can create tickets only for devices they own.
- Validate issue description length.
- Do not accept technician assignment from student/lecturer request.
- Generate ticket ID server-side.
- Sanitize issue description.

### Scaling Decisions

- Ticket ID must be indexed and unique.
- Keep ticket creation transactional with initial log creation.
- Use short selected fields after creation.

### Automated Tests

- Valid ticket is created for owned device.
- Ticket creation rejects another user's device.
- Ticket ID is generated server-side.
- Initial status is correct.
- Initial log is created.

### Manual Checklist

- Create a ticket for a registered device.
- Confirm ticket ID appears.
- Confirm status starts as Registration Completed.
- Try creating ticket for another user's device.
- Confirm ticket appears in current user's list.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 7: Repair Ticket Creation.

Build repair request creation for students and lecturers. Generate ticket IDs server-side, enforce device ownership, set initial status to REGISTRATION_COMPLETED, and create an initial repair log in the same transaction.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for ownership enforcement, server-side ticket ID generation, initial status, validation, and transaction behavior. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 8: Ticket List, Detail, And Ownership Filtering

### Goal

Show ticket lists and details based on user role and authorization.

### Scope

- Student/lecturer own ticket list.
- Technician assigned ticket list.
- Admin all-ticket list.
- Ticket detail page.
- Filters by status, date, and ticket ID.

### Security Checks

- Enforce authorization on server queries.
- Do not rely on frontend filtering for privacy.
- Avoid exposing private owner data to unauthorized users.
- Validate filters and pagination.

### Scaling Decisions

- Paginate ticket lists.
- Use indexed filters.
- Avoid loading full logs in list pages.
- Load detail relations only on detail page.

### Automated Tests

- Student sees only own tickets.
- Technician sees only assigned tickets.
- Admin sees all tickets.
- Unauthorized ticket detail is rejected.
- Filters return expected scoped results.

### Manual Checklist

- Create tickets for two users.
- Confirm each user sees only their own tickets.
- Assign ticket to technician later or seed assignment.
- Confirm technician list is scoped.
- Confirm admin list includes all tickets.
- Test status and ticket ID filters.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 8: Ticket List, Detail, And Ownership Filtering.

Build role-scoped ticket list and ticket detail pages/APIs. Students and lecturers see owned tickets, technicians see assigned tickets, and admins see all tickets. Add validated filters and pagination.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for role-scoped list queries, unauthorized detail access, filter validation, and pagination. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 9: Technician Assignment

### Goal

Allow admins to assign repair tickets to technicians.

### Scope

- Admin assignment control.
- Assignment route.
- Technician list for assignment.
- Assignment notification record.

### Security Checks

- Admin-only assignment.
- Assigned user must have `TECHNICIAN` role.
- Ticket must exist.
- Do not allow students or lecturers to self-assign.

### Scaling Decisions

- Index `technicianId`.
- Keep assignment history in repair logs or explicit audit record.
- Notify technician asynchronously where possible later.

### Automated Tests

- Admin can assign technician.
- Non-admin cannot assign technician.
- Assignment rejects non-technician users.
- Assignment rejects missing ticket.
- Notification/log entry is created.

### Manual Checklist

- Log in as admin.
- Assign ticket to technician.
- Confirm technician sees assigned ticket.
- Try assignment as student and confirm denial.
- Try assigning admin/student as technician and confirm rejection.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 9: Technician Assignment.

Build admin-only technician assignment for repair tickets. Validate that the assignee is a technician, create a log or notification record, and update the ticket assignment.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for admin-only access, technician-role validation, missing ticket handling, and assigned ticket visibility. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 10: Repair Journey Status Transitions

### Goal

Allow assigned technicians and admins to move tickets through the controlled repair journey.

### Scope

- Status update route.
- Status update UI.
- Controlled transition rules.
- Status change log entries.
- Notification trigger records.

### Security Checks

- Only assigned technician or admin can update status.
- Validate status enum.
- Prevent skipped, backward, or invalid transitions unless admin override is explicitly implemented.
- Record every status change.

### Scaling Decisions

- Use a transaction for ticket status update, log creation, and notification creation.
- Keep status labels centralized.
- Use status index for dashboard and reports.

### Automated Tests

- Assigned technician can move to next status.
- Technician cannot skip statuses.
- Technician cannot update unassigned ticket.
- Student cannot update status.
- Status change creates log and notification.

### Manual Checklist

- Assign ticket to technician.
- Move from Registration Completed to Device Received.
- Try skipping to Ready for Collection.
- Confirm student can see timeline update.
- Confirm log entry is visible.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 10: Repair Journey Status Transitions.

Build controlled repair journey updates. Only assigned technicians and admins can update status. Use the centralized status flow, prevent invalid transitions, and create repair log plus notification records in one transaction.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for allowed transitions, skipped transition rejection, unauthorized users, unassigned technician access, log creation, and notification creation. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 11: Repair Logs And Audit Timeline

### Goal

Expose a clear timeline of diagnoses, notes, status changes, and technician updates.

### Scope

- Technician repair note form.
- Diagnosis field.
- Repair notes field.
- Timeline UI on ticket detail.
- Admin full audit view.

### Security Checks

- Only assigned technician or admin can add internal repair notes.
- Students and lecturers can view safe timeline information but not private internal notes if marked private later.
- Sanitize diagnosis and repair notes.
- Bound note lengths.

### Scaling Decisions

- Paginate or lazy-load long timelines later.
- Keep timeline sorted by creation date.
- Store structured status with each log entry.

### Automated Tests

- Technician can add log to assigned ticket.
- Technician cannot add log to unassigned ticket.
- Student cannot add log.
- Note length validation works.
- Timeline returns sorted logs.

### Manual Checklist

- Add diagnosis as technician.
- Add repair note.
- Confirm timeline order.
- Confirm student sees appropriate progress.
- Confirm unauthorized note creation fails.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 11: Repair Logs And Audit Timeline.

Build repair log creation and ticket timeline display. Enforce assigned technician/admin write access, validate and sanitize notes, and return timeline entries in stable chronological order.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for write authorization, validation, timeline sorting, and unauthorized access. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 12: Dashboard Notifications

### Goal

Create and display dashboard notifications for key repair events.

### Scope

- Notification list for current user.
- Mark as read.
- Notification creation from assignment and status updates.
- Basic unread count.

### Security Checks

- Users can only read their own notifications.
- Users can only mark their own notifications as read.
- Do not include sensitive internal notes in notification messages.

### Scaling Decisions

- Index user ID and status.
- Paginate notifications.
- Keep notification creation in service functions so future email/SMS can reuse events.

### Automated Tests

- User sees own notifications only.
- Mark read works for own notification.
- Mark read rejects another user's notification.
- Assignment creates technician notification.
- Status update creates owner notification.

### Manual Checklist

- Assign ticket and confirm technician notification.
- Update status and confirm owner notification.
- Mark notification as read.
- Confirm unread count changes.
- Try reading another user's notification.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 12: Dashboard Notifications.

Build current-user notification listing, unread count, and mark-as-read behavior. Ensure assignment and status update flows create safe notification records. Do not add SMS or WhatsApp.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for notification ownership, mark-read authorization, unread count, assignment notifications, and status update notifications. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 13: Role Dashboards

### Goal

Create practical dashboards for students, lecturers, technicians, and admins.

### Scope

- Student/lecturer dashboard: active tickets, recent repair history, notifications.
- Technician dashboard: assigned tickets, daily workload, status queue.
- Admin dashboard: total tickets, pending assignments, active repairs, completed repairs.

### Security Checks

- Dashboard queries must be role-scoped server-side.
- Do not expose all tickets to non-admin users.
- Avoid leaking technician performance data to students.

### Scaling Decisions

- Use small aggregate queries.
- Avoid loading full ticket details on dashboard.
- Add caching only after authorization safety is proven.

### Automated Tests

- Student dashboard returns own counts.
- Technician dashboard returns assigned counts.
- Admin dashboard returns global counts.
- Unauthorized dashboard access is rejected.

### Manual Checklist

- Open dashboard as student.
- Open dashboard as lecturer.
- Open dashboard as technician.
- Open dashboard as admin.
- Confirm numbers match seeded/manual records.
- Confirm no role sees data they should not see.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 13: Role Dashboards.

Build role-specific dashboards with server-scoped queries. Students and lecturers see their own ticket summary, technicians see assigned work, and admins see operational totals. Keep dashboard cards dense, readable, and practical.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for role-scoped dashboard data and unauthorized access. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 14: Reports And Analytics

### Goal

Give admins insight into common problems, repairs by faculty, device types, monthly repair trends, and technician performance.

### Scope

- Admin reports page.
- Reports API/server module.
- Date range filters.
- Aggregates for status, faculty, device type, and technician.
- Simple charts or accessible data tables.

### Security Checks

- Admin-only reports.
- Avoid exposing unnecessary personal data.
- Validate date filters.
- Ensure aggregate queries do not bypass tenant/role assumptions if multi-campus is added later.

### Scaling Decisions

- Use database aggregation where possible.
- Add indexes for report filters.
- Keep charts fed by compact aggregate DTOs.

### Automated Tests

- Non-admin reports are rejected.
- Date filters validate.
- Aggregates return expected counts.
- Technician performance excludes password/private data.

### Manual Checklist

- Open reports as admin.
- Try reports as student and confirm denial.
- Filter by date range.
- Confirm repairs by faculty counts.
- Confirm technician performance values match sample data.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 14: Reports And Analytics.

Build admin-only analytics for common problems, repairs by faculty, device types, monthly trends, and technician performance. Use validated date filters and compact aggregate responses. Use accessible tables or simple charts without adding heavy dependencies unless justified.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for admin-only access, date validation, aggregate correctness, and private data exclusion. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 15: QR Code Ticket Lookup

### Goal

Generate and use QR codes for fast ticket lookup.

### Scope

- QR code generation for ticket detail or printable ticket.
- Public or semi-public lookup route by ticket ID.
- Safe limited status view for lookup.

### Security Checks

- QR lookup must not expose private user details.
- Treat ticket ID as sensitive enough to limit data.
- Validate ticket ID format.
- Consider requiring owner login for full detail.

### Scaling Decisions

- Generate QR from stable ticket URL.
- Avoid storing QR binary unless needed.
- Cache generated QR if generation becomes expensive.

### Automated Tests

- QR lookup validates ticket ID.
- Unknown ticket returns not found.
- Lookup response excludes private owner fields.
- Full detail still requires authorization.

### Manual Checklist

- Open ticket detail and see QR code.
- Scan QR or open lookup URL.
- Confirm limited ticket status appears.
- Confirm private notes and personal info are hidden.
- Confirm full detail still requires login.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 15: QR Code Ticket Lookup.

Add QR code generation for ticket lookup and a safe lookup page/API. The lookup must show limited status information only and must not expose private user details or internal notes.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for ticket ID validation, unknown tickets, limited response shape, and full-detail authorization. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 16: Optional Photo Upload

### Goal

Allow users to attach an optional device/problem photo to a repair request.

### Scope

- Upload UI.
- Server validation for file size and type.
- Supabase Storage or selected storage provider integration.
- Store only safe photo URL/path in database.

### Security Checks

- Validate MIME type and extension.
- Enforce max file size.
- Do not allow executable uploads.
- Store files in a controlled bucket/path.
- Avoid public access to private images unless intentionally approved.

### Scaling Decisions

- Use object storage, not database blobs.
- Store metadata in PostgreSQL.
- Generate signed URLs if photos are private.

### Automated Tests

- Valid image passes validation.
- Oversized file is rejected.
- Invalid MIME type is rejected.
- Ticket photo URL/path is saved only after successful upload.

### Manual Checklist

- Create ticket without photo.
- Create ticket with valid image.
- Try uploading oversized file.
- Try uploading non-image file.
- Confirm photo is visible only to authorized users.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 16: Optional Photo Upload.

Add optional repair request photo upload with strict file validation and storage integration. Use object storage, not database blobs. Store only a safe URL/path in the repair ticket record. Keep upload access authorized.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for file validation, oversized rejection, invalid MIME rejection, and authorized photo visibility. Run npm run test, npm run typecheck, npm run lint, and npm run build. Provide the manual checklist before moving to the next feature.
```

## Feature 17: Production Hardening And Deployment Readiness

### Goal

Prepare the app for secure deployment on Vercel with Supabase PostgreSQL.

### Scope

- Environment variable validation.
- Security headers.
- Rate limiting plan or implementation for auth routes.
- Error handling standardization.
- Health check readiness.
- Deployment documentation.

### Security Checks

- Validate required environment variables at startup or server use.
- Use secure cookies in production.
- Add security headers.
- Avoid stack traces in production responses.
- Add rate limiting for login/register where possible.
- Confirm no secrets in Git history.

### Scaling Decisions

- Use Supabase pooled connection for runtime.
- Use direct URL only for migrations.
- Avoid global mutable state except Prisma client singleton.
- Document backup and migration process.

### Automated Tests

- Environment validation rejects missing required values.
- Error responses do not expose internals.
- Auth cookies use production-safe settings.
- Health endpoint returns stable shape.

### Manual Checklist

- Confirm Vercel environment variables are configured.
- Confirm Supabase `DATABASE_URL` and `DIRECT_URL` are correct.
- Run production build locally.
- Deploy preview.
- Test login/register on preview.
- Test ticket creation on preview.
- Test role access on preview.
- Confirm no secrets are committed.

### Agent Prompt

```text
Read docs/ARCHITECTURE.md, docs/CONSTRAINTS.md, docs/PROJECT_SETUP.md, docs/PROJECT_DEFINITION.md, and docs/DEVELOPMENT_PLAN.md before making changes.

Implement Feature 17: Production Hardening And Deployment Readiness.

Add environment validation, production-safe security headers/cookie settings, standardized error responses, auth route rate limiting if feasible, and deployment documentation for Vercel plus Supabase. Do not add Phase 2 product features.

Before implementation, list affected files, explain the plan, and identify risks. Add tests for environment validation, safe error responses, cookie settings, and health endpoint shape. Run npm run test, npm run typecheck, npm run lint, npm run build, and npm audit. Provide the manual checklist before considering MVP complete.
```

## Final MVP Acceptance Checklist

Complete this only after all features above are done:

- User can register and log in.
- Roles work for student, lecturer, technician, and admin.
- Student or lecturer can register a device.
- Student or lecturer can create a repair ticket.
- Ticket ID is generated server-side.
- Admin can assign a technician.
- Assigned technician can update repair status.
- Invalid status transitions are rejected.
- Repair logs create an audit timeline.
- Notifications appear for key events.
- Dashboards are scoped by role.
- Admin reports show real aggregate data.
- QR lookup does not leak private data.
- Optional photo upload validates size and type if implemented.
- All protected routes enforce authorization server-side.
- `npm run test` passes.
- `npm run typecheck` passes.
- `npm run lint` passes.
- `npm run build` passes.
- `npm audit` has no unresolved high or critical vulnerabilities.
- Manual role/access testing has been completed.
