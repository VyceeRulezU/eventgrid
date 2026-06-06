# Agent Prompt — UX Improvements, Super Admin, User Flows, Accounting & Feature Additions
## EventGrid — Product Iteration Brief
**Version:** 1.0
**Scope:** Multiple modules — read fully before touching any file

---

## How to Read This Document

This document covers six areas of work. Implement them in the order listed. Each section specifies exactly which files to create or modify. Reference the existing agent docs for all tokens, schema, and query patterns:

- Design tokens → `05_UI_GUIDELINES.md`
- Database schema → `02_DATABASE_SCHEMA.md`
- Feature specs → `03_FEATURE_SPECS.md`
- API contracts → `04_API_CONTRACTS.md`

Do not hardcode hex values. Do not use Tailwind. All CSS via tokens and CSS Modules.

---

## Section 1 — Event Detail Page UX Overhaul

The current event detail page has six structural problems. Fix all of them.

### Problem 1 — Header hierarchy is broken

The event name, status badges, countdown, edit icon, Tasks button, and Client Portal button are all visually equal. Fix the hierarchy:

**New header structure:**

```
Row 1 (top):
  [← back]  [Event Name — large, bold]  [Event Type badge]  [edit icon]
                                                              [countdown: 34d 13h 48m]

Row 2 (below):
  [draft badge] [Unpaid badge — gold border, prominent] [large badge] [Phase 1 of 9]
                                                         [Tasks btn] [Client Portal btn]
```

- Event name: `var(--text-title-lg)`, `var(--weight-bold)`, `var(--color-text-primary)`
- Unpaid badge when payment_status is 'unpaid': treat it as urgent — `background: var(--color-warning-bg)`, `color: var(--color-warning)`, `border: 1px solid var(--color-warning)`, font weight semibold
- Countdown: right-aligned, three segments (DAYS / HRS / MIN), each segment is a small card with `var(--color-accent)` number and `var(--color-text-muted)` label
- Tasks and Client Portal buttons move to Row 2, right-aligned cluster

### Problem 2 — Info cards with empty critical fields

The six info cards (Event Date, End Date, Venue, Guests, Budget, Progress) currently treat "Not set" as an equal peer to filled values.

Fix rules:
- Any card with an empty/null value AND that value is critical (Budget especially) renders with `border: 1px solid var(--color-accent-border)` and a tappable `"Set →"` prompt in `var(--color-accent)`
- Budget card when null: show "Not set" + "Set budget →" as a button that opens the budget input inline
- Progress card: replace "11% complete" text with an actual progress bar (`height: 4px`, `background: var(--color-accent)`, `border-radius: var(--radius-full)`) + percentage label

### Problem 3 — Stat cards must all be interactive

Currently Vendors, Tasks Overdue, Open Issues, and Phases Done are static. Live Board alone has "Open →". This is inconsistent.

Fix: make all five stat cards navigable:
- Vendors → navigates to Vendor Management tab/page for this event
- Tasks Overdue → navigates to Tasks filtered to "overdue"
- Open Issues → navigates to Live Board issues list
- Phases Done → navigates to Phases tab
- Live Board → existing behaviour (Open →)

Add `cursor: pointer` and hover state (`border-color: var(--color-accent-border)`) to all five cards. Add a subtle `→` or chevron icon that appears on hover.

### Problem 4 — Redefine tab content

The four tabs (Overview, Timeline, Phases, Modules) currently have ambiguous or duplicated content. Redefine:

**Overview tab** — remove the phase pipeline from here. Replace with:
1. "Next Step" contextual prompt card (see Problem 6 below)
2. Financial snapshot strip: Total Budget | Total Paid | Outstanding (visible to planner only — hide entirely for other roles)
3. Upcoming deadlines: next 3 tasks/milestones due, sorted by date
4. Recent activity feed: last 5 actions on this event (vendor added, task completed, client viewed portal, etc.) — pull from a new `event_activity` log

**Timeline tab** — visual horizontal Gantt of all 9 phases mapped against actual dates. Each phase shows: start date, end date, status colour. Clickable to jump to that phase.

**Phases tab** — move the existing phase pipeline here. This is where it belongs. Keep the card row, remove the redundant dot-node row above it (they show the same data — the cards are more useful).

**Modules tab** — a 3-column icon grid of all feature modules for quick access:
```
[Vendors] [Financials*] [Team]
[Guests]  [Tasks]       [Live Board]
[Aftermath] [Run Sheet] [Documents]
```
*Financials only visible to planner role

### Problem 5 — Remove duplicate phase representations

On the Phases tab, there are currently two phase representations:
1. Dot-node pipeline (numbered circles 1–9 with labels)
2. Card row (rectangular cards with phase names)

Remove the dot-node pipeline. Keep only the card row. The progress bar (11%) and "1 of 9 phases completed" label stay above the card row. This cleans up significant visual noise.

### Problem 6 — Add "Next Step" contextual prompt

Add a `NextStepCard` component that renders below the header and above the tabs. It shows one contextual action based on event state:

```typescript
// Logic for what to show:
if (event.payment_status === 'unpaid') {
  // "Activate this event to unlock all features" + Pay button
}
else if (daysUntilEvent <= 7 && preEventChecklistIncomplete) {
  // "Event in X days — Pre-event checklist has 4 items remaining" + Go to Checklist
}
else if (overdueTaskCount > 0) {
  // "X tasks are overdue — review and reassign" + Go to Tasks
}
else if (currentPhase.status === 'in_progress') {
  // "Phase X in progress — Y items remaining" + Continue
}
else {
  // null — don't render the card at all
}
```

Styling: `background: var(--color-accent-muted)`, `border: 1px solid var(--color-accent-border)`, `border-radius: var(--radius-xl)`, left gold border accent (`border-left: 3px solid var(--color-accent)`).

### New: Add event_activity log table

Add to Supabase schema:

```sql
CREATE TABLE event_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  actor_id    uuid REFERENCES profiles(id),
  actor_name  text,
  action_type text NOT NULL,
  description text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz DEFAULT now()
);

-- RLS: planner and coordinator of this event only
ALTER TABLE event_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_planner_coordinator"
  ON event_activity FOR SELECT
  USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
        OR coordinator_id = auth.uid()
    )
  );
```

Log activity on: vendor added/confirmed/paid, task created/completed, guest imported, phase status change, client portal viewed, issue raised/resolved, document uploaded.

---

## Section 2 — Super Admin

### Database change

```sql
ALTER TABLE profiles
  ADD COLUMN is_super_admin boolean DEFAULT false;
```

Set your own account to `true` directly in the Supabase dashboard. Never expose a UI to create super admins.

### RLS additions

Add a super admin bypass policy to every sensitive table:

```sql
-- Template — repeat for: events, financial_entries, organizations,
-- event_vendors, vendors, profiles, event_access
CREATE POLICY "super_admin_bypass_events"
  ON events FOR ALL
  USING (
    (SELECT is_super_admin FROM profiles WHERE id = auth.uid()) = true
  );
```

### Route

Add `/admin` as a protected route. Guard logic:

```typescript
// AdminGuard.tsx
if (!profile?.is_super_admin) {
  return <Navigate to="/dashboard/planner" replace />
}
```

Do not link to `/admin` from any navigation — it is accessed by typing the URL directly.

### Admin Dashboard pages

Create `src/pages/admin/` with:

```
AdminLayout.tsx         — sidebar: Orgs | Events | Revenue | Users | Announcements | Flags
AdminOrgsPage.tsx       — all organizations, owner, plan, event count, join date
AdminEventsPage.tsx     — all events across all orgs, status, payment, date
AdminRevenuePage.tsx    — Paystack transactions, total revenue, per-event breakdown
AdminUsersPage.tsx      — all profiles, role, org, suspend/unsuspend toggle
AdminAnnouncementsPage.tsx — create a platform-wide notice that appears in all dashboards
AdminFlagsPage.tsx      — feature flag toggles per org or globally
```

Admin pages use the same design tokens. No special styling needed — they are internal tools.

---

## Section 3 — First-Time vs Returning User Flows

### Database additions

```sql
-- Add to profiles table
ALTER TABLE profiles
  ADD COLUMN has_completed_onboarding boolean DEFAULT false,
  ADD COLUMN onboarding_step          integer DEFAULT 0;

-- Add to events table
ALTER TABLE events
  ADD COLUMN first_viewed_at timestamptz;
```

### First-Time User Flow

Trigger: `profile.has_completed_onboarding === false`

On first login after registration, show an `OnboardingModal` (full-screen overlay, cannot be dismissed):

```
Step 1 of 3 — Welcome to EventGrid
"Let's set up your first event in 3 steps"

[✅] Event created              ← auto-checked if event exists
[☐]  Set your event budget      ← opens inline budget input
[☐]  Add your first vendor      ← opens add vendor flow

                    [Skip for now — I'll do this later]  [Continue →]
```

On all 3 complete (or skip): set `has_completed_onboarding = true`, fire confetti animation (`canvas-confetti` — add to dependencies), redirect to event dashboard.

On the event detail page, first-time users (first_viewed_at is null for this event) see a **Getting Started strip** above the phase pipeline:

```
┌──────────────────────────────────────────────────────────────┐
│  👋 Start here — complete these steps to activate Phase 1    │
│  [Set budget →]  [Add first vendor →]  [Upload client brief →] │
└──────────────────────────────────────────────────────────────┘
```

This strip is permanently hidden once Phase 1 is marked complete. Store dismissal in `localStorage` keyed to `event_id`.

Set `first_viewed_at = now()` on first load of the event detail page.

### Returning User Flow

Trigger: `profile.has_completed_onboarding === true`

No tooltips. No onboarding prompts. Show instead:

- **"Needs Attention" section** at the top of Overview tab — only renders if at least one of these is true:
  - Overdue tasks exist
  - Vendor balance due within 7 days
  - Phase deadline within 3 days and status not 'completed'
  - Client hasn't viewed portal in 7+ days (if portal was generated)
- **Activity feed** on Overview tab showing last 5 actions on this event
- `NextStepCard` (from Section 1, Problem 6) replaces the getting started strip

---

## Section 4 — Additional Accounting Features

### 4a — Income / Client Payment Tracker

Add a new tab inside the Financial module: **"Income"**

New table:

```sql
CREATE TABLE client_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description     text NOT NULL,         -- 'Deposit', 'Balance', 'Extra: AV upgrade'
  amount          bigint NOT NULL,        -- kobo
  payment_type    text DEFAULT 'incoming' CHECK (payment_type IN ('incoming', 'refund')),
  status          text DEFAULT 'pending' CHECK (status IN ('pending', 'received', 'overdue')),
  due_date        date,
  received_date   date,
  payment_method  text,                   -- 'bank_transfer', 'cash', 'pos'
  reference       text,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- RLS: planner only (same pattern as financial_entries)
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_payments_planner_only"
  ON client_payments FOR ALL
  USING (
    event_id IN (
      SELECT id FROM events WHERE org_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
      )
    )
  );
```

Income tab UI:
```
Client Payments — Awards and Prize Giving Day

Total Contract Value:    ₦1,780,000
Total Received:          ₦500,000
Outstanding from Client: ₦1,280,000   ← red if > 0 and event within 14 days

┌─────────────────────────────────────────────────────────┐
│ Description     │ Amount     │ Due Date  │ Status       │
├─────────────────────────────────────────────────────────┤
│ Deposit         │ ₦500,000   │ 1 Jun     │ ✅ Received  │
│ Balance         │ ₦1,200,000 │ 1 Jul     │ ⏳ Pending   │
│ Extras (AV)     │ ₦80,000    │ 1 Jul     │ ⏳ Pending   │
└─────────────────────────────────────────────────────────┘
```

### 4b — Profit & Loss Summary

Add a `P&L` card at the top of the Financial module (visible to planner only):

```
Event P&L — Awards and Prize Giving Day
──────────────────────────────────────────────────────
Total Revenue (from client):    ₦1,780,000
Total Vendor Cost:              ₦1,450,000
──────────────────────────────────────────────────────
Gross Profit:                   ₦330,000
Margin:                         18.5%
──────────────────────────────────────────────────────
Planner Fee (your charge):      ₦250,000   ← from income tracker, tagged 'Planner Fee'
Net to Vendor:                  ₦1,200,000
```

Calculations are all client-side from existing tables. No new schema needed.

```typescript
const totalRevenue = clientPayments.reduce((sum, p) => sum + p.amount, 0)
const totalVendorCost = financialEntries.reduce((sum, e) => sum + e.total_amount, 0)
const grossProfit = totalRevenue - totalVendorCost
const margin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : 0
```

Colour rules: margin > 20% → green, 10–20% → yellow, < 10% → red.

### 4c — Budget Allocation by Category

Add a `budget_allocations` table:

```sql
CREATE TABLE budget_allocations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category    text NOT NULL,
  allocated   bigint NOT NULL DEFAULT 0,   -- kobo
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(event_id, category)
);
```

On the Financial module, show per-category: Allocated vs Actual spend vs Variance. Rendered as a horizontal bar per category.

### 4d — Petty Cash Log

New table:

```sql
CREATE TABLE petty_cash (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount      bigint NOT NULL,
  logged_by   uuid REFERENCES profiles(id),
  receipt_url text,
  logged_at   timestamptz DEFAULT now()
);
```

Simple list UI in the Financial module — "Add expense" button, description + amount + receipt photo. Petty cash total feeds into the P&L as an additional cost line.

### 4e — Payment Due Alerts

On the Financial module header, add an alerts strip:

```
⚠️  3 vendor payments due this week — ₦450,000 total   [Review →]
⚠️  Client balance of ₦1,200,000 due in 14 days         [Review →]
```

Logic: query `financial_entries` where `payment_status != 'paid'` and `payment_date` within 7 days. Query `client_payments` where `status = 'pending'` and `due_date` within 14 days.

---

## Section 5 — High-Value Features to Add

Implement these in the order listed. They are additive — no existing code breaks.

### 5a — Event Template Library

New table:

```sql
CREATE TABLE event_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id),
  name          text NOT NULL,
  event_type    text NOT NULL,
  description   text,
  vendor_list   jsonb,    -- array of {category, typical_budget_pct}
  task_list     jsonb,    -- array of {title, phase_number, days_before_event}
  phase_config  jsonb,    -- default due dates as days-before-event offsets
  is_public     boolean DEFAULT false,   -- future: community templates
  created_at    timestamptz DEFAULT now()
);
```

UI: In Events list page, "Create from Template" option alongside "Create New Event". After creating from template, vendors, tasks, and phase due dates are pre-populated. Planner can save any completed event as a template: "Save as Template" in the event overflow menu.

### 5b — Document Vault

New table:

```sql
CREATE TABLE event_documents (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  uploaded_by   uuid NOT NULL REFERENCES profiles(id),
  name          text NOT NULL,
  category      text NOT NULL CHECK (category IN (
                  'contract', 'proposal', 'invoice', 'permit',
                  'venue_agreement', 'insurance', 'brief', 'other'
                )),
  file_url      text NOT NULL,
  storage_path  text NOT NULL,
  file_size     integer,
  vendor_id     uuid REFERENCES event_vendors(id),   -- link doc to specific vendor
  created_at    timestamptz DEFAULT now()
);
```

Add a "Documents" tab to the event detail page. Drag-and-drop upload, filter by category, preview in-browser for PDFs.

### 5c — Event Duplication

Add "Duplicate Event" to the event overflow menu (`⋮`).

Logic:
```typescript
async function duplicateEvent(sourceEventId: string, newName: string, newDate: Date) {
  // 1. Copy event row (new name, new date, status: 'draft', payment_status: 'unpaid')
  // 2. Copy all event_vendors rows (reset payment fields to 0)
  // 3. Copy all tasks rows (reset status to 'pending', recalculate due dates)
  // 4. Copy event_templates structure if it exists
  // Do NOT copy: guests, financial_entries, media, issues, client_portals
}
```

### 5d — Team Attendance & Check-In (Event Day)

Add `checked_in_at` and `is_on_site` to `event_access`:

```sql
ALTER TABLE event_access
  ADD COLUMN is_on_site      boolean DEFAULT false,
  ADD COLUMN checked_in_at   timestamptz,
  ADD COLUMN check_in_notes  text;
```

On the Live Board page, add a "Team" panel showing:
- All team members for this event
- Green = on-site, Grey = not yet, Red = expected but not checked in (past start time)
- Team members self-check-in via a button on their mobile dashboard
- Coordinator sees count: "8 / 12 team on-site"

### 5e — Proposal Builder

New table:

```sql
CREATE TABLE proposals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_by      uuid NOT NULL REFERENCES profiles(id),
  title           text NOT NULL,
  event_concept   text,
  mood_board_urls jsonb,        -- array of image URLs
  vendor_summary  jsonb,        -- selected vendors with amounts
  total_budget    bigint,
  planner_fee     bigint,
  notes           text,
  status          text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'rejected')),
  sent_at         timestamptz,
  approved_at     timestamptz,
  pdf_url         text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);
```

Add "Create Proposal" in Phase 1 (Lead & Client Onboarding). Builder UI has sections: Event Concept (rich text), Mood Board (image upload grid), Vendor Plan (auto-pulled from event_vendors), Budget Summary (auto-pulled from financials). Export as branded PDF via `@react-pdf/renderer`. "Send to Client" marks status as 'sent' and makes it visible in the client portal.

---

## Section 6 — Coordinator Dashboard Rebuild

**The coordinator dashboard must not look like the planner dashboard.** They are different mental models.

- Planner thinks in: events, money, client relationships, long-term planning
- Coordinator thinks in: today's tasks, team status, vendor arrival, what's happening right now

### Create separate coordinator dashboard

File: `src/pages/coordinator/CoordinatorDashboard.tsx`
File: `src/pages/coordinator/CoordinatorDashboard.module.css`

This replaces the current shared dashboard for coordinator role. The planner dashboard is untouched.

### Layout structure

```
┌─────────────────────────────────────────────────────────┐
│  Good morning, [Name] 👋        [Today's date]          │
├─────────────────────────────────────────────────────────┤
│  TODAY'S FOCUS                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ 🔴 Eko Wedding 2025 — EVENT DAY                    │ │  ← if event is today
│  │ Or: Awards Gala — in 3 days                        │ │  ← if event is upcoming
│  └────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  MY TASKS — TODAY                                       │
│  ☐ Confirm final catering headcount  ⚠️ Overdue         │
│  ☐ Send team briefing document                          │
│  ☐ Call venue coordinator                               │
│  ✅ Vendor confirmation calls — done                    │
├─────────────────────────────────────────────────────────┤
│  STAT STRIP                                             │
│  [Tasks Due Today: 4] [Team Confirmed: 8/12] [Vendors: 14 confirmed] │
├─────────────────────────────────────────────────────────┤
│  UPCOMING EVENTS                                        │
│  Eko Wedding 2025       — 3 days   [Open →]             │
│  GTBank Corporate Gala  — 18 days  [Open →]             │
│  Funke Birthday         — 34 days  [Open →]             │
└─────────────────────────────────────────────────────────┘
```

### Rules

- No financial data anywhere on this page — not even totals
- No client portal section
- No phase pipeline — coordinators execute within phases, they don't manage them
- Tasks shown are only tasks assigned to this coordinator for their events
- "Today's Focus" card is red/urgent if event is today, gold/alert if within 7 days, surface-2 if further out
- Upcoming events sorted by date ascending, max 5 shown, "View all" link
- Stat strip numbers link to the relevant module: Tasks → Tasks page, Team → Team page, Vendors → Vendor Assignments

### Coordinator sidebar navigation (different from planner)

Planner sidebar: Dashboard | Events | Financials | Vendors | Vendor Directory | Team | Guests | Tasks | Live Board | Aftermath | Clients | Settings

Coordinator sidebar:
```
MAIN
  Dashboard

MY PROJECTS
  Active Events    ← their assigned events
  My Tasks

EVENT MODULES (context-sensitive, only shows when inside an event)
  Vendors
  Team
  Live Board
  Run Sheet

DIRECTORY
  Vendor Directory  ← shared national vendor directory

  Settings
```

No Financials. No Clients. No Aftermath (coordinators can view but don't own it).

---

## Quality Checklist

Before marking any section complete:

- [ ] No hardcoded hex values — all colours via `var(--token)`
- [ ] No Tailwind classes
- [ ] Financial module and all financial data: zero visibility for non-planner roles
- [ ] `event_activity` logs on every significant action
- [ ] Super admin route (`/admin`) not linked from any navigation
- [ ] `is_super_admin` is never settable via any frontend form
- [ ] Coordinator dashboard uses `CoordinatorDashboard.tsx`, not a shared component with hidden sections
- [ ] All new tables have RLS enabled with explicit policies
- [ ] All currency stored as kobo, displayed as ₦ formatted Naira
- [ ] All new components render cleanly at 390px mobile width
- [ ] TypeScript: no `any` types on financial or role-related logic
