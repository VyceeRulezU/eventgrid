# EventGrid — System Architecture
## Agent Context Document 01
**For:** Antigravity / Cursor AI Agent
**Version:** 1.0

---

## 1. Architecture Overview

EventGrid is a React SPA (Single Page Application) powered by Supabase as the full backend. There is no custom API server. All data operations go directly from the React client to Supabase using the `@supabase/supabase-js` client library.

```
Browser (React + Vite)
    │
    ├── Supabase Auth          → JWT-based auth, role stored in user metadata
    ├── Supabase Database      → PostgreSQL with Row Level Security
    ├── Supabase Realtime      → Live event board subscriptions
    ├── Supabase Storage       → Photos, documents, receipts
    └── Supabase Edge Functions → Paystack webhook, invite emails, PDF gen
```

---

## 2. Authentication Model

### 2.1 Supabase Auth

All users authenticate via Supabase Auth. Role is stored in `user_metadata` at sign-up and mirrored in the `profiles` table.

```typescript
// user_metadata shape (set at registration)
{
  role: 'planner' | 'coordinator' | 'vendor' | 'client',
  org_id: string | null,       // set after org creation
  display_name: string,
  phone: string
}
```

### 2.2 Auth Flows

**Planner registration (self-service):**
```
/register → role selection → planner form → Supabase signUp()
→ email verification → /onboarding/planner → create org → /dashboard/planner
```

**Coordinator registration (self-service, standalone):**
```
/register → role selection → coordinator form → Supabase signUp()
→ email verification → /onboarding/coordinator → /dashboard/coordinator
```

**Coordinator invited by planner:**
```
Planner sends invite → system emails magic link → coordinator clicks
→ Supabase signUp() with pre-filled email → role auto-set to coordinator
→ scoped to planner's event only → /event/:id/coordinator
```

**Vendor invited:**
```
Planner invites vendor via email → magic link → vendor signs up
→ role: vendor, scoped to event_id → /vendor/event/:id
```

**Client portal:**
```
Planner generates client portal link → /portal/:access_token
→ NO auth required → read-only SSR-compatible route
→ token validated against client_portals table
```

### 2.3 Post-Login Routing

After every login, check `user_metadata.role` and redirect:

```typescript
const roleRoutes = {
  planner: '/dashboard/planner',
  coordinator: '/dashboard/coordinator',
  vendor: '/dashboard/vendor',
  client: '/dashboard/client'   // fallback if they somehow log in
}
```

---

## 3. Data Flow

### 3.1 Standard Read (e.g. load event details)

```
Component mounts
→ useEvent(eventId) hook
→ supabase.from('events').select('*, event_phases(*), vendors(*)')
  .eq('id', eventId).single()
→ RLS policy checks user has access to this event
→ data returned, Zustand store updated
→ component renders
```

### 3.2 Realtime (Live Event Board)

```
LiveBoard component mounts
→ supabase.channel('live_board:event_' + eventId)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'live_board_items',
    filter: `event_id=eq.${eventId}`
  }, handleUpdate)
  .subscribe()
→ Any INSERT/UPDATE to live_board_items for this event
  → all subscribed clients get the change instantly
→ Component re-renders with new status
```

### 3.3 File Upload (Photos)

```
User captures/selects photo
→ Client-side compression (browser-image-compression lib, max 800px, 200KB)
→ supabase.storage.from('event-media').upload(path, file)
→ path format: /{org_id}/{event_id}/{timestamp}_{tag}.jpg
→ Insert row to media table with public URL
→ UI updates media gallery
```

### 3.4 Payment Flow (Paystack)

```
Planner creates event → selects event size → clicks "Activate Event"
→ Paystack inline popup (₦5k / ₦10k / ₦15k)
→ On success: Paystack sends webhook to Supabase Edge Function
→ Edge Function verifies signature, updates events.payment_status = 'paid'
→ Event is now active, all modules unlocked
```

---

## 4. State Management (Zustand)

Four stores:

```typescript
// auth.store.ts
interface AuthStore {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  org: Organization | null
  setUser: (user: User) => void
  clearAuth: () => void
}

// event.store.ts
interface EventStore {
  activeEvent: Event | null
  events: Event[]
  setActiveEvent: (event: Event) => void
  updatePhase: (phaseId: string, data: Partial<Phase>) => void
}

// liveBoard.store.ts
interface LiveBoardStore {
  items: LiveBoardItem[]
  issues: Issue[]
  updateItem: (id: string, status: StatusLevel) => void
  addIssue: (issue: NewIssue) => void
}

// ui.store.ts
interface UIStore {
  sidebarOpen: boolean
  activeModal: string | null
  toasts: Toast[]
  setSidebarOpen: (open: boolean) => void
  showToast: (toast: Toast) => void
}
```

---

## 5. Notification Architecture

Abstracted from day one. Phase 1 delivers in-app + email. Phase 2 adds WhatsApp via same events.

```typescript
// lib/notifications.ts
interface NotificationEvent {
  type: NotificationType
  recipientId: string
  eventId: string
  payload: Record<string, unknown>
}

type NotificationType =
  | 'vendor_invited'
  | 'vendor_confirmed'
  | 'task_assigned'
  | 'task_completed'
  | 'issue_raised'
  | 'milestone_reached'
  | 'client_approval_needed'
  | 'payment_received'
  | 'event_day_brief'

// Phase 1: notify() → in-app notification row + Supabase email
// Phase 2: notify() → in-app + email + Termii WhatsApp
async function notify(event: NotificationEvent): Promise<void> {
  await Promise.all([
    createInAppNotification(event),    // Always
    sendEmail(event),                   // Phase 1+
    // sendWhatsApp(event),             // Phase 2: uncomment + implement
  ])
}
```

---

## 6. Security Model

### 6.1 Row Level Security Philosophy

Every table has RLS enabled. Default: deny all. Access is explicitly granted per role.

Three key isolation rules:
1. **Financial isolation** — `financial_entries` rows are only accessible to the planner whose `org_id` owns the event
2. **Event scoping** — vendors and coordinators can only read rows where they have a record in `event_access` table
3. **Client portal** — reads via service role key in Edge Function, token validated before any data returned

### 6.2 Environment Variables

```bash
# .env.local
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PAYSTACK_PUBLIC_KEY=

# Supabase Edge Functions (server-side only)
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
TERMII_API_KEY=              # Phase 2
```

### 6.3 Client Portal Security

```typescript
// No auth. Token-based access only.
// /portal/:token route

// Edge Function validates:
const portal = await supabase
  .from('client_portals')
  .select('event_id, expires_at, is_active')
  .eq('access_token', token)
  .single()

if (!portal || !portal.is_active || portal.expires_at < new Date()) {
  return new Response('Invalid or expired link', { status: 403 })
}
// Then fetch allowed event data and return it
```

---

## 7. Deployment Architecture

```
GitHub repo
    └── Vercel (auto-deploy on push to main)
         ├── React SPA → Vercel CDN
         ├── /portal/* → client portal routes (no auth)
         └── API routes → none (direct Supabase)

Supabase project
    ├── Database (PostgreSQL)
    ├── Auth
    ├── Storage (event-media bucket)
    └── Edge Functions
         ├── /paystack-webhook
         ├── /send-invite
         └── /generate-report    (Phase 2)
```

---

## 8. Performance Targets

| Metric | Target | Context |
|---|---|---|
| Dashboard load | < 2s on 3G | Nigerian network reality |
| Live board update | < 500ms | Supabase Realtime |
| Image upload feedback | < 1s to show preview | Client-side compression first |
| First Contentful Paint | < 1.5s | Vercel CDN + code splitting |
| Bundle size (initial) | < 250KB gzipped | Lazy load heavy features |

### Code Splitting Strategy

```typescript
// Lazy load role-specific dashboards
const PlannerDashboard = lazy(() => import('./pages/planner/Dashboard'))
const CoordinatorDashboard = lazy(() => import('./pages/coordinator/Dashboard'))
const VendorPortal = lazy(() => import('./pages/vendor/Portal'))

// Lazy load heavy features
const FinancialModule = lazy(() => import('./features/financials/FinancialModule'))
const LiveBoard = lazy(() => import('./features/live-board/LiveBoard'))
const GuestManager = lazy(() => import('./features/guests/GuestManager'))
```
