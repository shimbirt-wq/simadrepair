# Admin Dashboard UX Audit

Date: 2026-06-26

## Evidence And Limits

- Scope: admin dashboard and shared admin shell in `src/app/dashboard/page.tsx`, `src/app/app-shell.tsx`, `src/app/globals.css`, `src/app/admin/users/page.tsx`, `src/app/admin/devices/page.tsx`, and `src/app/repair-tickets/page.tsx`.
- Live observation: `localhost:3000/dashboard` opened successfully, but the existing browser session was logged in as Lead Technician. The live shell confirmed the role-based sidebar/header structure and metric dashboard rendering.
- Screenshot limit: the in-app browser was unavailable, and Chrome automation was interrupted by an extension UI during admin login. This audit is therefore code-grounded plus one live DOM observation, not a completed pixel-perfect screenshot audit.
- Accessibility limit: source review can identify likely risks, but it cannot prove full keyboard, screen reader, zoom, or contrast compliance without rendered testing.

## 1. Executive Verdict

Almost, but not production-ready as a polished admin dashboard tomorrow.

The foundation is serious and close: the dark sidebar, restrained palette, role-based shell, tabular numbers, and compact cards already feel more like an operational SaaS than a student project. The weak point is that the admin dashboard does not yet behave like an admin command surface. It mostly shows passive counts and generic navigation, while the real admin jobs are supervising risk, staffing, departments, categories, escalations, settings, and operational exceptions.

## 2. Health Score

6.5 / 10

Strong enough to keep. Not strong enough to ship unchanged as the final admin experience.

## 3. Top 10 UX / Design Issues

### 1. High - Admin overview is too passive

Evidence: `AdminDashboardView` shows count tiles, a weekly chart, and status breakdown only (`src/app/dashboard/page.tsx:245-278`). It does not show the tickets, exceptions, staff issues, or setup gaps requiring admin action.

User impact: admins must leave the dashboard to understand what needs attention. The first screen looks like reporting, not command and control.

Recommended fix: add an "Needs attention" section with overdue/high severity tickets, custody exceptions, unassigned requests, and pending student actions. Keep the current metrics, but make them secondary to actionable work.

Production priority: must fix before launch.

### 2. High - Sidebar IA is incomplete for the stated admin role

Evidence: admin navigation has Overview, Reports, Staff, Devices & Custody, Tickets Archive, Profile (`src/app/app-shell.tsx:74-83`). It does not include Departments, Service Categories, Escalations, or Settings, which are part of the stated admin job.

User impact: the admin role feels underbuilt. Users may not know where to configure the service platform or manage the university structure.

Recommended fix: restructure sidebar into Operations, Administration, and Account. Add clear placeholders or disabled roadmap entries only if the features do not exist yet.

Production priority: must fix before launch if those features exist; otherwise should fix soon with clear scope.

### 3. High - Mobile shell is not production-ready

Evidence: below 960px, the sidebar becomes a static full-width block above content (`src/app/globals.css:666-686`). There is no drawer, compact rail, sticky mobile header, or hamburger.

User impact: on tablets and phones, users must scroll through navigation before reaching urgent dashboard content. This feels unfinished.

Recommended fix: replace the mobile sidebar behavior with a top mobile app bar and slide-over nav. Keep desktop sidebar unchanged.

Production priority: must fix before launch if mobile/tablet use is expected.

### 4. Medium - Header hierarchy is duplicated and vague

Evidence: AppShell renders a topbar h1 such as "Overview" (`src/app/app-shell.tsx:181-188`), then the dashboard renders another h1 "Management visibility for SIMADRepair." (`src/app/dashboard/page.tsx:445-455`).

User impact: the page has competing headings. "Management visibility" sounds abstract and does not tell admins what to do.

Recommended fix: use one real page h1: "Admin Overview". Below it, use a short operational subtitle such as "Monitor service desk health, staff capacity, and custody exceptions."

Production priority: must fix before launch.

### 5. Medium - Primary actions are generic

Evidence: admin dashboard actions are "Staff" and "Reports" (`src/app/dashboard/page.tsx:357-367`). Admin users page uses "Create Staff Account" (`src/app/admin/users/page.tsx:38-47`).

User impact: actions do not clearly match common admin intent. "Staff" reads like navigation, not an action.

Recommended fix: use explicit commands: "Add staff", "View reports", "Create service category", "Manage departments". Keep only one primary action per screen.

Production priority: should fix soon.

### 6. Medium - Logo and role badge compete in a narrow sidebar

Evidence: the full logo and role badge share the 240px sidebar brand row (`src/app/app-shell.tsx:136-155`, `src/app/globals.css:107`).

User impact: the brand area can feel cramped, especially with the full wordmark and long role labels.

Recommended fix: use logo mark + product name or full logo only, then move role into the user block or topbar. Keep the sidebar brand row calmer.

Production priority: should fix soon.

### 7. Medium - Admin list pages do not use the shared table system

Evidence: admin users and devices hand-roll tables with repeated Tailwind table classes (`src/app/admin/users/page.tsx:68-103`, `src/app/admin/devices/page.tsx:65-95`) instead of the global `.data-table` pattern (`src/app/globals.css:632-663`).

User impact: tables will drift visually across the admin area. That creates the "template stitched together" feeling.

Recommended fix: extract shared `DataTable`, `TableToolbar`, pagination, and empty-state components. Use them for users, devices, tickets, and reports.

Production priority: should fix soon.

### 8. Medium - Empty states are too thin

Evidence: dashboard and lists have simple text-only empty states, for example "No tickets match the current filters" (`src/app/repair-tickets/page.tsx:137`) and "No overdue or at-risk tickets" in dashboard logic.

User impact: new deployments with little data look unfinished. Admins get no guidance on what to do next.

Recommended fix: add structured empty states with title, explanation, and next action. Example: "No custody exceptions" + "Devices with missing storage location or overdue pickup will appear here."

Production priority: should fix soon.

### 9. Medium - Accessibility state is incomplete

Evidence: active sidebar links use a CSS class and chevron, but no visible code-level `aria-current` (`src/app/app-shell.tsx:108-120`). Duplicate h1 structure exists on dashboard. Role badge colors are hard-coded inline (`src/app/app-shell.tsx:88-99`, `src/app/app-shell.tsx:140-155`).

User impact: keyboard and assistive technology users may receive weaker page/state cues than visual users.

Recommended fix: add `aria-current="page"` to active nav links, clean heading order, verify contrast of dark-sidebar role badges, and ensure focus styles remain visible on dark surfaces.

Production priority: must fix before launch for core navigation.

### 10. Low - Visual language is close but not fully systemized

Evidence: layout tokens exist (`src/app/globals.css:100-110`), but components mix Tailwind utilities, global classes, and inline styles across the shell and pages.

User impact: future screens will drift. This is the root cause of inconsistent spacing, radii, and table/header treatment.

Recommended fix: keep the palette, but consolidate shell, page header, buttons, table, metric tile, empty state, and badges into reusable components.

Production priority: polish, but should start before more dashboards are redesigned.

## 4. Sidebar / Navigation Audit

Strengths:

- Role-based navigation is already implemented.
- Admin, lead, and technician have separate nav sets.
- The dark sidebar is appropriate for a serious operational platform.

Issues:

- Admin IA is too shallow for university operations.
- "Tickets Archive" belongs under Operations or Records, not generic Manage.
- "Profile" should not sit beside administrative modules; it belongs in the user/account area.
- Active state is visually present but should also be semantic with `aria-current`.
- Lead nav uses "Add Technician" as a nav item, while admin uses "Staff"; role-specific naming is inconsistent.

Recommended admin sidebar:

```text
Operations
- Overview
- Requests
- Devices & Custody
- Escalations
- Reports

Administration
- Staff
- Departments
- Service Categories
- SLA & Priorities
- Settings

Account
- Profile
- Sign out
```

If some modules are not implemented yet, show only implemented routes and keep the naming ready for expansion.

## 5. Header / Logo Audit

Strengths:

- The logo asset is real and uses `next/image`.
- The topbar keeps actions and user identity in predictable places.

Issues:

- The sidebar brand row is crowded by full logo plus role badge.
- The user identity appears in both sidebar footer and topbar.
- Topbar title plus dashboard h1 creates repeated page identity.
- Admin actions are too generic.

Recommended direction:

- Sidebar: logo only, calm and left-aligned.
- Topbar: page title, one subtitle, one primary action, optional secondary action.
- Move role badge to user menu or keep it in the topbar identity only.
- Use "Admin Overview" as the page title, not just "Overview".

## 6. Dashboard Content Hierarchy Audit

Current hierarchy:

1. Generic role label and abstract heading.
2. Notification badge.
3. Eight metric tiles.
4. Weekly closed chart.
5. Status breakdown.

Problem:

The dashboard tells admins "what exists" but not "what to do next."

Recommended hierarchy:

1. Attention strip: overdue, custody exceptions, unassigned requests, waiting student, ready pickup.
2. Action table: "Needs admin review" with ticket, student, owner, age, reason, action.
3. Operational health metrics.
4. Trend chart and status breakdown.
5. Staff/capacity snapshot.
6. System setup shortcuts.

## 7. Tables, Cards, And Controls Audit

Strengths:

- Card density is reasonable.
- Buttons use restrained styling.
- Numeric values use tabular number settings.

Issues:

- Admin tables lack shared table structure.
- Table actions are repetitive and generic.
- Filter panels are visually heavy relative to the content.
- Pagination is plain text and buttons, not a system component.
- Empty states do not help admins recover.

Recommended direction:

- Create a shared table pattern with toolbar, columns, status badges, row actions, pagination, empty state, and mobile stacked rows.
- Use consistent table header tracking. The current admin pages use `tracking-[0.18em]`, while global `.data-table` uses `0.09em`.
- Use row-level action menus only when more than one action exists. Otherwise use one clear "View" link.

## 8. Typography, Spacing, And Visual Consistency Audit

Strengths:

- Hanken Grotesk is suitable for a modern service platform.
- The palette is calm and professional.
- Content max width and padding are defined with tokens.

Issues:

- Inline styles in AppShell make spacing and color harder to standardize.
- `radius-xl` is used heavily for panels and controls, while some cards use `rounded-lg`; this can feel inconsistent across screens.
- Dashboard headings are conservative but sometimes too vague.
- The UI has several eyebrow labels; overuse can make the hierarchy feel noisy.

Recommended direction:

- Keep Hanken Grotesk.
- Use 8px radius for most cards/tables; reserve 12px for larger shell containers if needed.
- Standardize page spacing: 28px desktop, 20px tablet, 16px mobile.
- Define reusable `PageHeader`, `MetricTile`, `Panel`, `DataTable`, `EmptyState`, and `RoleBadge`.

## 9. Accessibility Risks

- Duplicate h1/page identity on dashboard.
- Missing `aria-current` for active navigation.
- Dark sidebar role badge colors need contrast verification.
- Mobile navigation likely creates poor keyboard and screen-reader flow when the entire sidebar appears before content.
- Tables need caption/summary patterns or stronger page context.
- Empty states should be announced as meaningful content, not just muted text.

## 10. Recommended Improvement Plan

### Phase 1 - Admin UX hardening before launch

1. Rename and restructure admin shell navigation.
2. Clean page header hierarchy: one h1, one subtitle, clear actions.
3. Move/resize role badge and simplify logo row.
4. Add `aria-current` and verify focus states.
5. Replace mobile static sidebar with drawer/topbar navigation.

### Phase 2 - Admin dashboard redesign

1. Add "Needs attention" command section.
2. Add actionable risk table for overdue, high severity, unassigned, and custody exception items.
3. Reorder metrics by urgency, not data category.
4. Keep weekly trend and status breakdown below the action sections.
5. Add admin setup shortcuts: staff, departments, categories, reports, settings.

### Phase 3 - Admin component system

1. Extract shared page header.
2. Extract shared table and pagination.
3. Extract metric tile and status badge variants.
4. Extract empty/loading/error state components.
5. Replace duplicated table markup in users/devices/tickets.

### Phase 4 - QA

1. Verify desktop at 1440px and 1280px.
2. Verify tablet at 1024px.
3. Verify mobile at 390px.
4. Keyboard-test sidebar, topbar actions, tables, search, pagination.
5. Check contrast on dark sidebar badges and muted text.

## 11. Final Production-Ready Checklist

- [ ] Admin sidebar matches real admin responsibilities.
- [ ] Active nav has visual and semantic state.
- [ ] Logo row is not cramped.
- [ ] Dashboard first screen shows urgent work, not only passive metrics.
- [ ] Admin dashboard has actionable tables.
- [ ] Page has one clear h1.
- [ ] Header actions are explicit and role-appropriate.
- [ ] Tables use a shared design pattern.
- [ ] Empty states include next actions.
- [ ] Mobile navigation is a real drawer/topbar pattern.
- [ ] Keyboard focus is visible on sidebar and controls.
- [ ] Admin pages share spacing, radius, typography, and table treatment.

## 12. Screenshot-Based Continuation

Added after reviewing the admin screenshots supplied by the user.

### Updated visual verdict

The admin area is visually stronger than the first source-only audit suggested. The dark sidebar, active states, white content surfaces, restrained blue buttons, tables, and typography already look credible for a university service platform.

The product still does not feel fully production-ready because several screens are structurally weak: the Overview is too passive, Tickets Archive looks empty and oversized, Reports uses warning colors for non-warning zero states, and Profile exposes a developer-style "Open notifications JSON" action.

Updated score from screenshot evidence: 7 / 10 visually, 6.5 / 10 for admin workflow UX.

### What to keep

- Keep the current color direction.
- Keep the dark sidebar.
- Keep Hanken Grotesk.
- Keep the active nav background treatment.
- Keep compact white cards with subtle border and shadow.
- Keep the table direction used on Staff and Devices.
- Keep blue as the main command color.

### New high-priority findings from screenshots

#### 1. Critical - "Open notifications JSON" is not production UI

Evidence: the Profile screen shows a button labeled "Open notifications JSON".

User impact: this looks like an internal developer/debug action. It immediately lowers trust and makes the product feel unfinished.

Recommended fix: remove it from production UI. Replace with "View notifications" if users need a readable notification center. Keep raw JSON access behind a dev-only environment guard.

Production priority: must fix before launch.

#### 2. High - Tickets Archive screen feels unfinished

Evidence: Tickets Archive has a large left "All repair tickets" card and a large filter card, but the actual result area only says "No tickets match the current filters." The layout creates a lot of empty space and makes the screen feel like a placeholder.

User impact: admins may think the page is broken or underbuilt.

Recommended fix: use a single operational list layout: page header, compact filter toolbar, ticket table/list, empty state. Do not split the page into two large panels when there are no results.

Production priority: must fix before launch.

#### 3. High - Overview has no command center section

Evidence: Overview shows metric cards, chart, and status breakdown. It does not show the actual ticket records needing admin attention.

User impact: the dashboard looks clean but does not help admins decide what to do next.

Recommended fix: add a top "Needs attention" section before charts:

```text
Needs attention
- 6 new/untriaged requests
- 0 custody exceptions
- 0 waiting student
- 0 ready pickup

Table columns:
Ticket, Requester, Device, Status, Age, Owner, Reason, Action
```

Production priority: must fix before launch.

#### 4. High - Reports page has a data trust issue

Evidence: "Tickets by faculty" shows "Computing" twice as separate rows.

User impact: admins will question the accuracy of reporting.

Recommended fix: normalize faculty labels before aggregation. Merge equivalent labels by canonical faculty ID or normalized lowercase/trimmed label.

Production priority: must fix before launch if reports are used for leadership decisions.

#### 5. Medium - Zero-value charts are visually misleading

Evidence: "Repairs closed per week" shows value `0` for each week but still renders blue bars/slivers at the bottom.

User impact: a zero chart should read as zero activity. Blue bars imply some activity happened.

Recommended fix: when count is `0`, render no filled bar. Use a neutral baseline and optional empty annotation.

Production priority: should fix soon.

#### 6. Medium - Reports warning colors overstate safe zero states

Evidence: cards such as Waiting Student, Waiting Parts, In Custody, and Overdue Pickup use pale yellow styling even when their value is `0`.

User impact: the report looks like multiple warnings even when there are no problems.

Recommended fix: use neutral styling for zero. Apply warning/danger tones only when the metric crosses a threshold.

Production priority: should fix soon.

#### 7. Medium - Search/filter areas are too heavy

Evidence: Staff, Devices, and Tickets Archive use large gray filter containers. On wide screens these consume too much visual weight.

User impact: search controls compete with the actual data.

Recommended fix: convert to a compact table toolbar: search input, filters, primary action, result count. Keep advanced filters collapsible.

Production priority: should fix soon.

#### 8. Medium - Page actions are inconsistent

Evidence: Overview has Staff and Reports. Reports has Dashboard. Devices has My devices. Profile has Open dashboard and Devices.

User impact: topbar actions feel route-specific rather than system-designed.

Recommended fix: define page action rules:

```text
Overview: Add staff, View reports
Reports: Export report, Refresh
Staff: Add staff
Devices: Register device or View custody
Tickets: Export, Reset filters
Profile: Edit profile or Change password
```

Production priority: should fix soon.

#### 9. Medium - Profile page is too card-heavy and not admin-useful

Evidence: Profile shows large gray information cards and a notification center. It does not show security, password, session, or account settings.

User impact: it reads as a static record, not a useful account area.

Recommended fix: split Profile into:

```text
Account details
Security
Notification preferences
Recent activity
```

Production priority: should fix soon.

#### 10. Low - Verify the thin dark red strip at the top of several screenshots

Evidence: several screenshots show a thin reddish-brown line across the very top.

User impact: if this is part of the app, it looks accidental and inconsistent with the approved palette.

Recommended fix: confirm whether it is browser chrome, a debug overlay, or app CSS. Remove it if it is app UI.

Production priority: polish.

### Page-by-page health

1. Reports: visually strong, but metric semantics and duplicate faculty rows need work.
2. Overview: clean and credible, but not actionable enough for admin operations.
3. Staff: strongest admin list page; needs denser toolbar and role labels converted from raw enum text.
4. Devices: clean, but sparse; should include custody state and owner context if this is admin device management.
5. Tickets Archive: weakest page; layout feels oversized and empty.
6. Profile: visually consistent, but includes a developer/debug JSON action and lacks real account-management workflows.

### Recommended build order

1. Remove or gate "Open notifications JSON".
2. Fix Reports faculty aggregation and zero-value chart bars.
3. Redesign Tickets Archive into a compact operational table/list page.
4. Add "Needs attention" to Overview.
5. Normalize page actions and table toolbar pattern across Staff, Devices, Tickets, and Reports.
6. Refine Profile into a real account settings area.

## 13. Locked Admin Color System

Decision: the admin section color direction is approved and locked.

Use the current implemented token direction as the source of truth:

- App background: cool slate off-white, not beige.
- Panels and tables: white surfaces with slate borders.
- Sidebar: dark navy.
- Active navigation: strong university blue.
- Primary actions and chart bars: the same strong blue.
- Admin role badge: blue, not red.
- Red: reserved only for true risk, danger, exceptions, destructive actions, or overdue states.
- Amber: reserved only for warning or waiting states with real non-zero counts.
- Green: reserved for healthy, ready, active, or complete states.

Do not introduce a new brand palette for admin dashboards unless contrast or accessibility testing proves a problem. Future admin, lead, and technician screens should inherit this token system instead of adding one-off page colors.
