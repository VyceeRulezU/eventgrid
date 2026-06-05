# EventGrid — Feature Specifications
## Agent Context Document 03
**For:** Antigravity / Cursor AI Agent
**Version:** 1.0

---

## How to Read This Document

Each feature section defines:
- **What it does** — user-facing behaviour
- **Data interactions** — which tables are read/written
- **Business rules** — logic the UI and backend must enforce
- **Edge cases** — what to handle gracefully

---

## 1. Event Creation & Activation

### What it does
Planner creates an event record, selects size tier, pays via Paystack, and the event becomes active with all 9 phases auto-generated.

### Flow
```
"Create Event" button
→ Modal/page: event name, type, date, venue (optional), guest count estimate
→ Size tier auto-suggested based on guest count, planner can override
→ "Save Draft" (free) OR "Activate Event" (triggers payment)
→ Paystack popup: ₦5,000 / ₦10,000 / ₦15,000
→ On payment success: events.payment_status = 'paid', events.status = 'active'
→ 9 phase rows auto-created via trigger
→ Redirect to event dashboard
```

### Business Rules
- Draft events are free, but modules are locked (read-only shell visible)
- Only paid/active events unlock all modules
- Planner can have unlimited drafts
- Event date is optional at creation — many Nigerian planners are still negotiating venues when they onboard clients
- `size_tier` determines price: intimate=500000 kobo, standard=1000000, large=1500000
- Paystack reference stored in `events.paystack_ref` for reconciliation

### Edge Cases
- Payment succeeds but webhook delayed → poll `events.payment_status` for 30 seconds, then show "Payment processing" state
- Duplicate event name within same org → warn but allow (same planner may do multiple events with same name in different years)

---

## 2. Phase Tracker

### What it does
Visual pipeline showing all 9 phases with status, completion percentage, and quick navigation.

### Data
- Reads: `event_phases` for current event
- Writes: `event_phases.status`, `event_phases.due_date`, `event_phases.owner_id`

### Display Rules
- Show all 9 phases in order
- Active phase highlighted
- Completed phases show checkmark + completion date
- Blocked phases show red indicator + tooltip with notes
- Click any phase → navigate to that phase's module
- Overall event progress = (completed phases / 9) × 100

### Business Rules
- Phases do not auto-advance — planner manually marks complete
- A phase can be marked complete even if the next one has already started
- Phase 7 (Event Day) auto-activates on the event date (status changes from not_started to in_progress at midnight of event date)
- Phases 8 and 9 only become available after Phase 7 is marked complete

---

## 3. Vendor Management

### What it does
Full vendor lifecycle: source → quote → negotiate → confirm → pay → deliver.

### Data
- Reads/writes: `vendors` (directory), `event_vendors` (per-event assignments)

### Vendor Directory
- Planner builds a personal vendor directory over time (persists across events)
- Adding a vendor to an event pulls from directory OR creates ad-hoc entry
- Ad-hoc vendors have no `vendor_id` — `vendor_name` is stored directly on `event_vendors`

### Booking Status Flow
```
Sourcing → Quoted → Negotiating → Confirmed → Paid → (Cancelled)
```
Status changes are manual. Each status change logs a timestamp.

### Quote Comparison
- Planner can add multiple quotes for the same category (e.g. 3 caterers)
- Side-by-side comparison table: vendor name, amount, notes, rating
- "Select" action sets that vendor as confirmed, marks others as not selected

### Payment Tracking (linked to Financial Module)
- When `event_vendors.payment_status` is updated, a corresponding `financial_entries` row is created or updated automatically
- This keeps the financial tracker in sync without manual double-entry

### Business Rules
- Confirmed vendors get an optional portal invite (email with event-scoped link)
- Cancelled vendors retain their row (soft cancel via status change)
- Vendor rating (1–5) is updated post-event in Phase 9

### Vendor Portal (Invited Vendor View)
- Vendor sees: their service description, delivery checklist, arrival time, contact name
- Vendor can: confirm arrival (button), upload delivery proof photos, update their status on live board
- Vendor cannot see: other vendors, financials, guest list, team tasks

---

## 4. Financial Module

### What it does
Naira payment tracker replacing the Excel template. Planner-admin only.

### Data
- Reads/writes: `financial_entries`
- Never exposed to any other role (RLS + frontend route guard)

### Table View
Columns mirror the Excel template:
```
Vendor Name | Description | QTY | Total (₦) | Advance (₦) | Balance (₦) | Status | Date | Notes
```

- Balance is auto-calculated (`total - advance`) — never manually editable
- Status colours: Unpaid = red badge, Advance = amber badge, Paid = green badge
- Rows grouped by vendor category (matching the Excel template categories)
- Category subtotals displayed per group
- Grand total row at bottom: Total Budget | Total Paid | Total Outstanding

### Summary Cards (top of financial page)
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Total Budget    │ │ Total Committed │ │ Total Paid      │ │ Outstanding     │
│ ₦2,450,000      │ │ ₦2,100,000      │ │ ₦1,350,000      │ │ ₦750,000        │
│                 │ │ 86% of budget   │ │ 64% of budget   │ │ 14 vendors      │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘
```

### Adding Entries
- "Add Entry" opens a row-insert form
- Vendor Name: typeahead from `event_vendors` for this event, or free text
- All currency fields: input in Naira (₦), stored as kobo (×100)
- Receipt upload: optional PDF/image, stored in `event-docs` bucket

### Export
- "Export to Excel" → generates .xlsx mirroring the original tracker format
- "Export to PDF" → formatted financial summary report

### Business Rules
- Currency always displayed as ₦ with comma formatting (₦1,350,000 not ₦1350000)
- Zero-balance entries (fully paid) still shown but visually dimmed
- Entries linked to `event_vendors` update both tables on edit (keep in sync)
- No delete — entries can be marked "cancelled" which zeroes the amounts visually

---

## 5. Team & Tasks

### What it does
Internal task management and team coordination per event.

### Data
- Reads/writes: `tasks`, `event_access` (for team roster)

### Team Roster
- Planner/coordinator invites team members by email or phone
- Invite creates `event_access` row with role = 'team_member'
- Team member accepts invite → gets scoped access to that event's tasks and live board

### Task Board
- Kanban view: Pending | In Progress | Done | Blocked
- List view: sortable by due date, priority, assignee
- Mobile: list view default (kanban is secondary)

### Task Card Shows
- Title, priority badge, assignee avatar, due datetime, status
- Tap to expand: full description, notes, update status button

### Creating a Task
- Title (required)
- Description (optional)
- Assignee (select from team roster or unassigned)
- Due date + time
- Priority: Low / Medium / High / Urgent
- Notes

### Business Rules
- Team members can only update status of tasks assigned to them
- Planners and coordinators can edit any task in their events
- Overdue tasks (past due_datetime, not done) shown with red indicator
- Completed tasks logged with `completed_at` timestamp
- Bulk task creation from templates (Phase 2)

---

## 6. Guest Management

### What it does
Full guest list, RSVP tracking, seating plan, VIP management, and event-day check-in.

### Data
- Reads/writes: `guests`, `seating_tables`

### Guest List
- Manual entry or CSV upload
- Fields: First name, last name, phone, email, RSVP status, group, VIP flag, plus-one
- Filter by: RSVP status, group, VIP, table, checked-in

### Seating Plan
- Create tables with name and capacity
- Drag guests onto tables (desktop) or assign via dropdown (mobile)
- Table shows: current occupancy vs capacity, VIP indicator
- Printable table tag / label generator per table

### Event Day Check-In
- Search by name or phone
- One-tap check-in marks `guests.checked_in = true` + logs timestamp
- Real-time counter: X checked in / Y total confirmed
- Check-in visible on coordinator dashboard during event

### RSVP Tracking
- Summary: Confirmed X | Pending X | Declined X | Total X
- Nigerian context: "Confirmed" count used for final catering numbers (Phase 6)

### Business Rules
- Guest list locked for editing 24 hours before event (planner can override)
- Checked-in count feeds live board "Registration" station status
- CSV import: validate phone numbers (+234 format), deduplicate on phone number

---

## 7. Pre-Event Finalization

### What it does
Final checklist, run sheet, and D-day briefing — the 1–7 days before the event.

### Data
- Reads/writes: `run_sheet_items`, `event_phases`, `event_vendors` (confirmation status)

### Components

**Final Vendor Confirmation Checklist**
- Auto-populated from `event_vendors` where booking_status = 'confirmed'
- Planner/coordinator ticks off each vendor as "Final confirmation received"
- Shows: vendor name, service, contact number, arrival time, delivery expectation

**Run Sheet Builder**
- Time-based table: Time | Duration | Item | Owner | Notes
- Drag to reorder items
- Export as PDF for team distribution

**D-Day Contact Sheet**
- Auto-generated from event vendors + team members
- Shows: Name, Role/Service, Phone number
- Printable / shareable as PDF

**Site Inspection Log**
- Notes field + photo upload
- Timestamped
- Tagged to Phase 6 in `media` table

**Team Briefing**
- Rich text editor for briefing notes
- Attached to event, visible to all team members in their briefing view

---

## 8. Live Event Board ⭐

### What it does
Real-time status monitoring on event day. The product's core differentiator.

### Data
- Reads/writes: `live_board_items` (Supabase Realtime)
- Writes: `issues` (issue flagging)
- Writes: `media` (photo capture)

### Status Cards
Each card shows:
- Station name (e.g. "Catering", "Registration", "AV/Sound")
- Status dot: 🟢 Green / 🟡 Yellow / 🔴 Red / ⚪ Grey
- Status label (free text, e.g. "Ready", "In Transit", "Delayed 20 mins")
- Last updated by + timestamp
- "Flag Issue" button

### Status Update Flow
```
Tap card → bottom sheet slides up (mobile) / modal (desktop)
→ Select status: Green / Yellow / Red
→ Type status label (optional, pre-fills with suggestions)
→ Save → Supabase UPDATE → Realtime pushes to all subscribers
→ All connected devices update within 500ms
```

### Pre-populated Stations
When live board is activated (event day), stations auto-populate from:
- Confirmed vendors (using their category as station name)
- Plus default stations: Registration, Program/MC, General

Planner/coordinator can add custom stations and reorder.

### Issue Flagging
```
Tap "Flag Issue" on any card
→ Issue form: title (required), description, severity (Low/Medium/High/Critical), photo
→ Submit → INSERT to issues table → notification sent to planner/coordinator
→ Issue badge appears on the card (count of open issues)
→ Card status auto-set to Red if severity is High or Critical
```

### Issue Resolution
```
Open issues list → tap issue → "Mark Resolved"
→ Enter resolution notes
→ issues.resolved_at = now(), issues.resolved_by = auth.uid()
→ Issue stays in log (never deleted) — moves to "Resolved" section
```

### Program Timer
- Run sheet displayed alongside the board
- Current item highlighted, countdown to next item
- Alert when item is running 5+ minutes late
- Team can mark items as done / delayed / skipped in real-time

### Photo Capture
- "Capture" button on any card or issue
- Opens camera (mobile) or file picker (desktop)
- Photo compressed client-side → uploaded to `event-media` bucket
- Tagged with station name, event_id, timestamp
- Stored in `media` table for aftermath review

### Live Guest Count
- Pulls from `guests` where `checked_in = true` for this event
- Updates in real-time as team checks guests in
- Displayed as: "342 / 500 guests arrived"

### Business Rules
- Live board only accessible when `events.status = 'in_progress'`
- Status auto-set to 'in_progress' on event date
- Issues are never deleted — append only
- All status changes logged with updater ID and timestamp
- Planner sees full board; coordinator sees full board; team members see only their assigned stations

---

## 9. Client Portal

### What it does
Read-only, token-based view for clients. No account required.

### Data
- Reads: `events`, `event_phases`, `media` (tagged 'client_share')
- Reads via: Edge Function with service role key (bypasses RLS safely)

### What Clients See
- Event name, date, venue
- Phase pipeline: which phases are complete, in progress, or upcoming
- Milestones/updates the planner has explicitly shared
- Mood board images (if shared)
- Post-event: summary report + selected media

### What Clients Do NOT See
- Financial data (ever)
- Vendor details or payment status
- Team tasks
- Issue flags
- Internal notes

### Approval Flow
- Planner marks a deliverable as "Needs Client Approval" (e.g. event concept, venue selection)
- Client sees approval card in their portal
- Client clicks "Approve" or "Request Changes" + comment
- Planner gets notified

### Business Rules
- Portal URL format: `eventgrid.ng/portal/{access_token}`
- Token is 64-character hex, unique per event
- Planner can revoke or regenerate the token
- Optional: set token expiry date
- `last_accessed` updated on every portal visit (for planner awareness)

---

## 10. Aftermath & Post-Event Analysis

### What it does
Media library, issue review, event report generation, and archiving.

### Data
- Reads: `media`, `issues`, `financial_entries`, `guests`, `run_sheet_items`, `event_vendors`
- Writes: `event_vendors.rating`, `event_phases` (mark 8 and 9 complete)

### Media Library
- All photos uploaded during the event, organised by:
  - Tag (issue photos, station photos, general, aftermath)
  - Uploader
  - Time captured
- Planner can mark selected photos as "client_share" → appear in client portal

### Issue Log Review
- Full list of all issues raised during the event
- Filter: Open / Resolved / By severity
- Each issue shows: description, photo, raised by, raised at, resolved at, resolution
- Planner adds "Lessons Learned" note per issue (optional)

### Event Report Builder
Generates a structured PDF report with:
- Event summary (name, date, venue, type)
- Attendance: confirmed vs actual check-ins
- Budget performance: planned vs actual spend, variance per category
- Vendor performance: rating per vendor (planner fills post-event)
- Timeline adherence: run sheet planned vs actual times
- Issues summary: total raised, total resolved, critical issues
- Lessons learned notes
- Client satisfaction score (NPS 0–10, auto-sent to client post-event)

Two report versions:
- **Internal report** (planner only): full data including financials
- **Client report** (shareable): attendance, highlights, selected media — no financials

### Business Rules
- Event is archived when Phase 9 is marked complete
- Archived events are read-only
- Archived events feed the planner's portfolio record
- Vendor ratings saved to `vendors.rating` (average of all event ratings)
- Client NPS survey auto-sent 24 hours after event date via email

---

## 11. Coordinator Standalone Projects

### What it does
Self-registered coordinators manage coordination gigs independently, without a planner's financial or client onboarding tools.

### Available Modules
- Project overview (event name, date, venue, client name)
- Vendor assignments (deliverables, arrival confirmations, status)
- Team tasks
- Live event board
- Post-event summary (no financial data)

### Not Available
- Financial module
- Client portal generation
- Phase 1–2 (lead onboarding, planning strategy)
- Guest management (Phase 2 for standalone coordinators)

### Pricing
₦3,000–₦5,000 per project, paid via Paystack at project activation.

### Business Rules
- Standalone coordinator projects stored in `events` table with `created_by = coordinator_id`
- `org_id` points to the coordinator's own organization record
- Financial module hidden at RLS + route level
- Coordinator can invite team members and vendors same as planner
