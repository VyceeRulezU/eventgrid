# Event Details Page

**Route:** `/events/:id` (click an event from the Events List)

---

## Header

- **Event name** — large title with pencil icon to edit inline
- **Type badge** — shown after `|` separator (class: `.headerType`)
- **Status badge** — colored dot + status text (draft/active/in_progress/completed/cancelled)
- **Unpaid/Paid badge** — gold warning border for unpaid, green for paid
- **Size tier** — badge (intimate/standard/large)
- **Phase indicator** — e.g. "Phase 2 of 9"
- **Countdown** — days/hrs/min until event date (right-aligned)
- **Tasks button** — navigates to `/events/:id/tasks`
- **Client Portal button** — opens portal generation modal
- **Unpaid banner** — shown when event is draft + unpaid, with Pay Now button

---

## Info Cards (below header)

| Field | Description |
|-------|-------------|
| Event Date | Date or "Not set" |
| End Date | Shown only if set |
| Venue | Venue name or "Not set" |
| Guests | Guest count or "Not set" |
| Budget | Amount or clickable "Set →" (gold accent) |
| Progress | Bar + percentage |

Fields with missing critical data get `.metaEmpty` class (normal border) or `.metaEmptyAccent` (gold border for budget).

---

## Stats Cards

Five interactive cards with hover chevron arrows:

| Card | Click navigates to |
|------|-------------------|
| Vendors | `/events/:id/vendors` |
| Tasks Overdue | `/events/:id/tasks` |
| Open Issues | Live Board (same event) |
| Phases Done | scrolls to Phases tab |
| Live Board | `/events/:id/live-board` |

---

## Tabs

### Overview
- **Next Step Card** — contextual prompt (activate payment, pre-event checklist, overdue tasks, phase in progress)
- **Financial Snapshot** — planner-only card showing budget totals
- **Upcoming Deadlines** — upcoming task/phase/vendor deadlines, overdue items in red
- **Recent Activity** — last 5 event_activity log entries with relative timestamps

### Timeline
- Renders `PhaseTimelineTracker` — visual timeline of all phases with dates

### Phases
- **Phase Pipeline** — horizontal pipeline of all 9 phases with status colors
- **Phase Manager** — toggle each phase complete/in-progress

### Modules
- Grid of all event feature modules (Vendors, Financials, Team, Guests, Tasks, Live Board, Aftermath, Analytics)
- Client Portal button

---

## Payment / Activation

When an event is draft + unpaid, a payment modal opens via the Pay Now button:

1. Click **Pay ₦20,000**
2. Choose **Paystack** or **Flutterwave**
3. Complete payment in the popup
4. Event auto-activates (status → `active`, payment_status → `paid`)
5. Modal auto-closes after 3 seconds

Test card details are shown inside the modal.

---

## CSS Module Classes

File: `src/features/events/EventDashboardPage.module.css`

Key classes you can override:
- `.headerType` — event type text after `\|` separator
- `.headerName` — event title
- `.metaItem`, `.metaEmpty`, `.metaEmptyAccent` — info card states
- `.statCard`, `.statCardClickable`, `.statCardArrow` — stat cards
- `.unpaidBanner` — gold activation banner
- `.countdown`, `.countdownItem`, `.countdownNum`, `.countdownLabel` — countdown display
