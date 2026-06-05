# EventGrid — Build Sequence
## Agent Context Document 06
**For:** Antigravity / Cursor AI Agent
**Version:** 1.0

---

## How to Use This Document

Work through steps in order. Do not skip ahead. Each step has a checklist — mark items complete before moving to the next step. Reference the other documents in this suite for specs, queries, and design tokens.

**Document references:**
- Architecture decisions → `01_ARCHITECTURE.md`
- Database tables and RLS → `02_DATABASE_SCHEMA.md`
- Feature logic → `03_FEATURE_SPECS.md`
- Query patterns → `04_API_CONTRACTS.md`
- Design tokens and components → `05_UI_GUIDELINES.md`

---

## Step 1 — Project Scaffolding

**Goal:** Clean Vite + React 18 project with all dependencies installed, vanilla CSS design system in place, and folder structure created.

### Tasks
- [ ] `npm create vite@latest eventgrid -- --template react-ts`
- [ ] Install dependencies:
  ```bash
  npm install @supabase/supabase-js zustand react-router-dom
  npm install react-hook-form @hookform/resolvers zod
  npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
  npm install recharts
  npm install lucide-react
  npm install date-fns
  npm install browser-image-compression
  npm install @react-pdf/renderer
  ```
- [ ] Remove the default Vite `src/index.css` and `src/App.css`
- [ ] Create `src/styles/` directory with four files from `05_UI_GUIDELINES.md`:
  - [ ] `tokens.css` — all CSS custom properties
  - [ ] `global.css` — resets, base element styles, Google Fonts import
  - [ ] `components.css` — shared component classes
- [ ] Import all three in `src/main.tsx` in correct order (tokens → global → components)
- [ ] Vite is configured to support CSS Modules by default — no additional config needed
- [ ] Create full folder structure as defined in `00_PROJECT_OVERVIEW.md`
- [ ] Set up `.env.local` with Supabase and Paystack keys (empty placeholders)
- [ ] Configure `vite.config.ts` with path aliases (`@/` → `src/`)
- [ ] Set up TypeScript paths in `tsconfig.json`

### Verification
- [ ] `npm run dev` runs without errors
- [ ] CSS tokens resolve correctly in the browser (inspect `:root` to confirm variables)
- [ ] Plus Jakarta Sans font loads from Google Fonts
- [ ] A test component using `var(--color-accent)` renders gold correctly

---

## Step 2 — Supabase Project Setup

**Goal:** Supabase project created, all tables and RLS policies applied, triggers installed, storage buckets created.

### Tasks
- [ ] Create Supabase project (region: `eu-west-2` or closest to Nigeria)
- [ ] Run all table creation SQL from `02_DATABASE_SCHEMA.md` in Supabase SQL editor (in order):
  - [ ] `profiles`
  - [ ] `organizations`
  - [ ] `events`
  - [ ] `event_access`
  - [ ] `event_phases`
  - [ ] `vendors`
  - [ ] `event_vendors`
  - [ ] `financial_entries`
  - [ ] `tasks`
  - [ ] `seating_tables`
  - [ ] `guests`
  - [ ] `live_board_items`
  - [ ] `issues`
  - [ ] `media`
  - [ ] `client_portals`
  - [ ] `notifications`
  - [ ] `run_sheet_items`
- [ ] Install all triggers:
  - [ ] `update_updated_at()` function + triggers on all relevant tables
  - [ ] `handle_new_user()` function + `on_auth_user_created` trigger
  - [ ] `create_event_phases()` function + `on_event_created` trigger
- [ ] Create storage buckets: `avatars`, `org-assets`, `event-media`, `event-docs`
- [ ] Configure storage RLS policies (authenticated users upload to their org path only)
- [ ] Enable Realtime on `live_board_items` and `issues` tables in Supabase dashboard
- [ ] Add Supabase URL and anon key to `.env.local`
- [ ] Create `src/lib/supabase.ts` as per `04_API_CONTRACTS.md`
- [ ] Generate TypeScript types: `npx supabase gen types typescript --project-id YOUR_ID > src/types/database.types.ts`

### Verification
- [ ] All tables visible in Supabase table editor
- [ ] Triggers appear in Supabase → Database → Triggers
- [ ] Storage buckets created and visible
- [ ] TypeScript types generated without errors

---

## Step 3 — Auth + Role-Based Routing

**Goal:** Full auth flow working. Users can register as planner or coordinator, log in, and land on the correct dashboard based on role.

### Tasks
- [ ] Create `src/store/auth.store.ts` (Zustand)
- [ ] Create `src/lib/supabase.ts` auth listener (sync session to store on app load)
- [ ] Build pages:
  - [ ] `/register` — email + password + display name + phone + role selection
  - [ ] `/login` — email + password
  - [ ] `/verify-email` — "Check your email" confirmation screen
  - [ ] `/onboarding/planner` — org name, business details (runs once after first login)
  - [ ] `/onboarding/coordinator` — name, phone confirmation (lighter onboarding)
- [ ] Build `RoleGuard` component — redirects if role doesn't match route
- [ ] Build `AuthGuard` component — redirects to `/login` if not authenticated
- [ ] Set up React Router with all route definitions:
  ```
  / → landing (public)
  /login → LoginPage
  /register → RegisterPage
  /onboarding/planner → PlannerOnboarding (AuthGuard)
  /onboarding/coordinator → CoordinatorOnboarding (AuthGuard)
  /dashboard/planner → PlannerDashboard (AuthGuard + RoleGuard: planner)
  /dashboard/coordinator → CoordinatorDashboard (AuthGuard + RoleGuard: coordinator)
  /dashboard/vendor → VendorPortal (AuthGuard + RoleGuard: vendor)
  /events/:id/* → EventRoutes (AuthGuard)
  /portal/:token → ClientPortal (no auth)
  ```
- [ ] Post-login redirect logic: read `user_metadata.role` → redirect to correct dashboard
- [ ] Handle invited users (magic link flow): on first load after magic link, detect `event_id` in metadata, redirect to scoped event view

### Verification
- [ ] Planner can register, verify email, complete onboarding, and reach planner dashboard
- [ ] Coordinator (standalone) can register and reach coordinator dashboard
- [ ] Non-planner visiting `/dashboard/planner` is redirected
- [ ] Unauthenticated user visiting any dashboard route is redirected to `/login`

---

## Step 4 — App Shell & Navigation

**Goal:** Responsive navigation shell in place. Bottom tab bar on mobile, sidebar on desktop/tablet.

### Tasks
- [ ] Build `BottomTabBar` component (mobile only, `md:hidden`)
- [ ] Build `Sidebar` component (desktop/tablet, `hidden md:flex`)
- [ ] Build `TopBar` component (mobile page header with back button + title)
- [ ] Build `PageHeader` component (desktop page header with title + actions slot)
- [ ] Build `AppShell` layout wrapper — renders correct nav based on screen size
- [ ] Implement sidebar active state (highlight current route)
- [ ] Implement financial tab visibility: only render if `role === 'planner'`
- [ ] Build role-selection screen (shown pre-login on landing) — four role cards
- [ ] Connect sidebar org name + avatar to `auth.store`

### Verification
- [ ] Bottom tab bar visible on 390px screen, hidden at 768px+
- [ ] Sidebar visible at 768px+
- [ ] Financial nav item absent for coordinator and vendor roles
- [ ] Active route highlighted correctly in both navs

---

## Step 5 — Event Creation & Dashboard

**Goal:** Planners can create events (draft + activate), see their events list, and open an event dashboard.

### Tasks
- [ ] Build `EventsListPage` — shows all planner events, sorted by date
  - [ ] Event card: name, type, date, status badge, phase progress bar
  - [ ] Empty state: "Create your first event" CTA
- [ ] Build `CreateEventModal` / `CreateEventPage`:
  - [ ] Fields: name, event type, date, venue, guest count
  - [ ] Size tier auto-suggestion based on guest count + manual override
  - [ ] "Save Draft" (free) and "Activate Event" (paid) actions
- [ ] Paystack inline integration:
  - [ ] Load Paystack JS script
  - [ ] On "Activate Event": open Paystack popup with correct amount
  - [ ] On success: call Edge Function or update event directly
  - [ ] On close without payment: return to draft state
- [ ] Build `EventDashboard` — the hub for a single event:
  - [ ] Phase pipeline visual (9 phases, click to navigate)
  - [ ] Event overview cards: date, venue, guest count, budget
  - [ ] Quick stats: tasks due today, vendors unconfirmed, open issues
- [ ] Build `PhasePipeline` component (used on dashboard + phase tracker page)

### Verification
- [ ] Draft event created → appears in list with "Draft" badge
- [ ] Paystack popup opens with correct amount
- [ ] After payment: event status updates to "active"
- [ ] 9 phase rows visible in Supabase after event creation (trigger fires)
- [ ] Event dashboard loads all overview data

---

## Step 6 — Financial Module

**Goal:** Planner can view, add, edit, and export the payment tracker.

### Tasks
- [ ] Build `FinancialsPage` (route-guarded: planner only)
- [ ] Build `PaymentTrackerTable`:
  - [ ] Grouped by category (gold group headers)
  - [ ] Columns: Vendor, Description, QTY, Total, Advance, Balance, Status, Date, Notes
  - [ ] Balance auto-calculated (never editable)
  - [ ] Payment status colour badges
  - [ ] Category subtotals
  - [ ] Grand total footer row
  - [ ] Horizontal scroll on mobile
- [ ] Build `FinancialSummaryCards` (4 cards: Budget, Committed, Paid, Outstanding)
- [ ] Build `AddEntryForm` (modal/drawer):
  - [ ] Vendor name (typeahead from event vendors)
  - [ ] All fields from schema
  - [ ] Currency input: ₦ prefix, stored as kobo
  - [ ] Receipt upload (PDF or image)
- [ ] Build `EditEntryForm` (same as add, pre-filled)
- [ ] Implement "Export to Excel" (use SheetJS to generate .xlsx mirroring template)
- [ ] Implement "Export to PDF" (summary report via @react-pdf/renderer)
- [ ] Sync: when `event_vendors` payment updated → auto-update `financial_entries`

### Verification
- [ ] Table renders all entries grouped correctly
- [ ] Balance column auto-calculates correctly
- [ ] Status badges show correct colours
- [ ] Financial page is completely absent from navigation for non-planner roles
- [ ] Export generates correct .xlsx with all columns

---

## Step 7 — Vendor Management

**Goal:** Planners and coordinators can manage vendor sourcing, booking, and payment tracking per event.

### Tasks
- [ ] Build `VendorManagementPage` (per event)
- [ ] Build `VendorCard` — shows name, category, booking status, payment status, balance
- [ ] Build `AddVendorModal`:
  - [ ] Search existing vendor directory
  - [ ] Or create ad-hoc vendor (no directory entry)
  - [ ] Fields: name, category, service, total amount, advance paid, booking status
- [ ] Build `VendorDetailDrawer` — full vendor detail + edit + payment update
- [ ] Build `QuoteComparisonView` — side-by-side for same category
- [ ] Build `VendorDirectory` (org-level, not event-specific):
  - [ ] List all org vendors
  - [ ] Add / edit / rate vendors
- [ ] Vendor invite flow: "Invite to Portal" button → calls `/send-invite` Edge Function

### Verification
- [ ] Vendor added to event → appears in vendor list
- [ ] Payment update → financial_entries row syncs
- [ ] Quote comparison shows multiple vendors for same category

---

## Step 8 — Team & Tasks

**Goal:** Planners and coordinators can manage team roster and task assignments per event.

### Tasks
- [ ] Build `TeamPage` (per event):
  - [ ] Team roster list with role, phone, task count
  - [ ] "Invite Team Member" button → email invite flow
- [ ] Build `TaskBoard`:
  - [ ] Kanban columns: Pending / In Progress / Done / Blocked (desktop)
  - [ ] List view (mobile default)
  - [ ] View toggle button
- [ ] Build `TaskCard`:
  - [ ] Title, priority badge, assignee avatar, due date, status
  - [ ] Tap to expand full detail
- [ ] Build `CreateTaskModal`:
  - [ ] All task fields
  - [ ] Assignee select from team roster
- [ ] Build `TaskDetailDrawer`:
  - [ ] Full task view
  - [ ] Status update (assignee can update own tasks)
  - [ ] Edit (planner/coordinator only)
- [ ] Overdue indicator: red border on cards past due_datetime

### Verification
- [ ] Tasks appear in correct kanban column
- [ ] Team member can only update status of their own tasks
- [ ] Overdue tasks show red indicator
- [ ] Mobile list view renders cleanly at 390px

---

## Step 9 — Live Event Board

**Goal:** Real-time status board fully functional with Supabase Realtime, issue flagging, and photo capture.

### Tasks
- [ ] Build `LiveBoardPage`:
  - [ ] Status cards grid (1 col mobile, 2 col tablet, 3 col desktop)
  - [ ] "Add Station" button
  - [ ] Program timer panel (run sheet countdown)
  - [ ] Live guest count widget
- [ ] Build `StatusCard` (see `05_UI_GUIDELINES.md` for component pattern)
- [ ] Build `StatusUpdateSheet` (bottom sheet mobile, modal desktop):
  - [ ] Status selector: Green / Yellow / Red
  - [ ] Status label input (with pre-fill suggestions)
  - [ ] Save triggers Supabase UPDATE
- [ ] Implement Supabase Realtime subscription (see `04_API_CONTRACTS.md`)
- [ ] Build `IssueFlag` flow:
  - [ ] "Flag Issue" button on each card
  - [ ] `RaiseIssueForm`: title, description, severity, photo
  - [ ] On submit: INSERT to issues, notify planner/coordinator
  - [ ] Auto-set card to red if severity high/critical
- [ ] Build `IssuesList` panel: all open/resolved issues for current event
- [ ] Build `IssueResolutionForm`: mark resolved + resolution notes
- [ ] Build photo capture:
  - [ ] Camera button on card and issue form
  - [ ] Client-side compression → Supabase Storage upload
  - [ ] Insert to media table
- [ ] Auto-activate: event status set to 'in_progress' on event date
- [ ] Build `ProgramTimer`:
  - [ ] Pulls from run_sheet_items
  - [ ] Shows current item + time remaining
  - [ ] Alert at 5-minute overrun

### Verification
- [ ] Two browsers open on same event → status change on one updates the other within 500ms
- [ ] Issue raised → planner gets in-app notification
- [ ] Photo uploads → appears in media library
- [ ] Issues never disappear after resolution — stay in log

---

## Step 10 — Client Portal

**Goal:** Token-based read-only client view accessible without authentication.

### Tasks
- [ ] Build `/portal/:token` route (public, no AuthGuard)
- [ ] Build `ClientPortalPage`:
  - [ ] Event name, date, venue header
  - [ ] Phase pipeline (read-only, completed phases shown)
  - [ ] Shared media gallery (photos tagged 'client_share')
  - [ ] Approval cards (if planner has marked items for approval)
- [ ] Build `ClientApprovalCard`:
  - [ ] "Approve" / "Request Changes" buttons
  - [ ] Comment input for change requests
- [ ] Build `GeneratePortalModal` (planner-side):
  - [ ] Client name, email, phone
  - [ ] Optional expiry date
  - [ ] Copy link button
  - [ ] Regenerate / revoke link
- [ ] Edge Function `/client-portal` validates token and returns safe data
- [ ] `last_accessed` updates on every portal visit

### Verification
- [ ] Portal URL opens without login
- [ ] Financial data is completely absent from portal
- [ ] Invalid/revoked token shows error page
- [ ] Planner sees `last_accessed` timestamp in portal settings

---

## Step 11 — Guest Management

**Goal:** Full guest list, RSVP tracking, seating plan, and event-day check-in.

### Tasks
- [ ] Build `GuestManagementPage`
- [ ] Build `GuestListTable`:
  - [ ] Columns: Name, Phone, RSVP, Group, VIP, Table, Checked-In
  - [ ] Filter bar: RSVP status, group, VIP, table
  - [ ] Search by name or phone
- [ ] Build `AddGuestModal` (manual entry)
- [ ] Build CSV import:
  - [ ] File picker → parse with PapaParse
  - [ ] Preview table before confirm
  - [ ] Phone normalisation (+234 format)
  - [ ] Deduplication warning on phone match
- [ ] Build `SeatingPlanView`:
  - [ ] Table cards with capacity + occupancy
  - [ ] Assign guest to table via dropdown (mobile) or drag (desktop)
- [ ] Build `CheckInView` (mobile-optimised):
  - [ ] Large search input
  - [ ] Guest card with one-tap check-in button
  - [ ] Live counter: X / Y arrived
- [ ] RSVP summary bar at top of guest page

### Verification
- [ ] CSV import parses and deduplicates correctly
- [ ] Check-in updates live board "Registration" station count
- [ ] Seating plan shows correct occupancy

---

## Step 12 — Aftermath & Reports

**Goal:** Post-event media review, issue log, and report generation.

### Tasks
- [ ] Build `AftermathPage`:
  - [ ] Tab navigation: Media | Issues | Report
- [ ] Build `MediaLibrary`:
  - [ ] Photo grid grouped by tag
  - [ ] Filter by: tag, uploader, date
  - [ ] "Mark as Client Share" toggle per photo
  - [ ] Lightbox viewer
- [ ] Build `IssueLogReview`:
  - [ ] All issues from event
  - [ ] Filter: open/resolved, severity
  - [ ] "Add Lessons Learned" note per issue
- [ ] Build `EventReportBuilder`:
  - [ ] Auto-populates: attendance, budget performance, vendor performance, timeline
  - [ ] Vendor rating input per vendor
  - [ ] Lessons learned summary
  - [ ] "Generate Internal Report" → PDF (full data)
  - [ ] "Generate Client Report" → PDF (no financials)
- [ ] Client NPS survey: auto-send email 24 hours post-event (Edge Function)
- [ ] Archive event on Phase 9 complete → set `events.status = 'completed'`, read-only

### Verification
- [ ] Media library shows all uploaded photos grouped correctly
- [ ] Internal report PDF includes financials
- [ ] Client report PDF does not include financials
- [ ] Archived event is read-only across all modules

---

## Step 13 — Landing Page & Onboarding Polish

**Goal:** Public-facing landing page and complete onboarding flows.

### Tasks
- [ ] Build `LandingPage`:
  - [ ] Hero section: headline, sub, CTA
  - [ ] Problem section (Nigerian planner pain points)
  - [ ] Feature highlights (phase tracker, live board, financials)
  - [ ] Role cards: Planner / Coordinator / Vendor / Client
  - [ ] Pricing section (per-event, ₦ denominated)
  - [ ] Footer: links, legal, social
- [ ] Build role selection screen (post-signup, pre-onboarding)
- [ ] Polish planner onboarding (org creation, logo upload)
- [ ] Polish coordinator onboarding (leaner)
- [ ] Add `react-helmet` for basic SEO meta tags

---

## Step 14 — Notifications System

**Goal:** In-app notifications working. Architecture ready for WhatsApp (Phase 2).

### Tasks
- [ ] Create `notifications` table rows on key events (use Supabase triggers or client-side calls)
- [ ] Build `NotificationsDrawer` (bell icon in top bar → slides in)
- [ ] Build `NotificationItem` component
- [ ] Mark as read on open
- [ ] Notification dot on bell when unread count > 0
- [ ] Subscribe to `notifications` table via Realtime for live updates
- [ ] Implement `lib/notifications.ts` abstraction layer (Phase 2 WhatsApp ready)

---

## Step 15 — QA, Performance & Deployment

**Goal:** Production-ready. All critical paths tested. Deployed to Vercel.

### Tasks
- [ ] Test all role permissions: sign in as each role, verify correct access
- [ ] Test RLS: attempt financial queries as coordinator → verify 0 rows returned
- [ ] Test Realtime: live board updates across two devices
- [ ] Test Paystack webhook on staging
- [ ] Run Lighthouse audit — target 85+ performance on mobile
- [ ] Check bundle size — lazy loading active for heavy features
- [ ] Configure Vercel project, connect GitHub repo
- [ ] Set all env vars in Vercel dashboard
- [ ] Configure custom domain: eventgrid.ng
- [ ] Test `/portal/:token` route on Vercel (ensure public access works)
- [ ] Set up Supabase Edge Functions deployment

---

## Phase 2 Backlog (Post-Launch)

These are confirmed features deferred from MVP. Build after launch validation.

- [ ] WhatsApp integration via Termii API
- [ ] Vendor self-registration + marketplace
- [ ] Bulk SMS RSVP for guests
- [ ] Guest management for standalone coordinators
- [ ] Run sheet templates library
- [ ] Task templates per event type
- [ ] Analytics dashboard (events run, revenue tracked, vendor ratings over time)
- [ ] Contract e-signature (DocuSign or native)
- [ ] Mobile app (React Native, reuse Supabase backend)
- [ ] PWA / offline mode for live board
- [ ] Multi-currency support (GHS, KES for Pan-Africa expansion)
- [ ] White-label client portal (custom domain per planner org)
