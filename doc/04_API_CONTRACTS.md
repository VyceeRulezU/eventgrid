# EventGrid — API Contracts & Query Patterns
## Agent Context Document 04
**For:** Antigravity / Cursor AI Agent
**Version:** 1.0

---

## Conventions

- All queries use `@supabase/supabase-js` v2
- Amounts are stored as kobo (integer), converted to Naira on display: `amount / 100`
- Naira display format: `₦${(amount / 100).toLocaleString('en-NG')}`
- All timestamps returned as ISO strings, display using `date-fns`
- Error handling: every query wrapped in try/catch, errors surfaced via `ui.store` toast

---

## Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

---

## Auth Queries

### Sign Up (Planner)
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: name,
      role: 'planner',
      phone
    }
  }
})
```

### Sign Up (Coordinator Standalone)
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      display_name: name,
      role: 'coordinator',
      phone
    }
  }
})
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
// After sign in: read data.user.user_metadata.role → redirect to correct dashboard
```

### Get Current Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
const role = session?.user?.user_metadata?.role
```

---

## Event Queries

### Create Event (Draft)
```typescript
const { data, error } = await supabase
  .from('events')
  .insert({
    org_id: profile.org_id,
    created_by: user.id,
    name,
    event_type,
    event_date,
    venue_name,
    guest_count,
    size_tier,
    budget_total: budgetInKobo,
    status: 'draft',
    payment_status: 'unpaid'
  })
  .select()
  .single()
// Trigger auto-creates 9 phase rows
```

### Fetch Planner's Events List
```typescript
const { data, error } = await supabase
  .from('events')
  .select(`
    id, name, event_type, event_date, status, payment_status,
    current_phase, guest_count, size_tier,
    event_phases(phase_number, status)
  `)
  .eq('org_id', profile.org_id)
  .is('deleted_at', null)
  .order('event_date', { ascending: true })
```

### Fetch Single Event (Full Detail)
```typescript
const { data, error } = await supabase
  .from('events')
  .select(`
    *,
    event_phases(*),
    event_vendors(id, vendor_name, category, booking_status, payment_status, total_amount, advance_paid, balance),
    tasks(id, title, status, priority, due_datetime, assignee_id),
    client_portals(access_token, is_active)
  `)
  .eq('id', eventId)
  .single()
```

### Activate Event (Post-Payment)
```typescript
// Called from Paystack webhook Edge Function — uses service role key
const { error } = await supabaseAdmin
  .from('events')
  .update({
    status: 'active',
    payment_status: 'paid',
    paystack_ref: reference
  })
  .eq('id', eventId)
```

---

## Phase Queries

### Update Phase Status
```typescript
const { error } = await supabase
  .from('event_phases')
  .update({
    status,
    completed_at: status === 'completed' ? new Date().toISOString() : null,
    notes
  })
  .eq('event_id', eventId)
  .eq('phase_number', phaseNumber)
```

---

## Vendor Queries

### Add Vendor to Event
```typescript
const { data, error } = await supabase
  .from('event_vendors')
  .insert({
    event_id: eventId,
    vendor_id: selectedVendor?.id ?? null,
    vendor_name: vendorName,
    category,
    service_desc,
    total_amount: totalInKobo,
    advance_paid: advanceInKobo,
    booking_status: 'confirmed'
  })
  .select()
  .single()
```

### Update Vendor Payment Status
```typescript
const { error } = await supabase
  .from('event_vendors')
  .update({
    advance_paid: advanceInKobo,
    payment_status: newStatus,
    payment_date: new Date().toISOString()
  })
  .eq('id', eventVendorId)
// Also sync financial_entries row
await syncFinancialEntry(eventVendorId, eventId)
```

---

## Financial Queries

### Fetch All Financial Entries for Event
```typescript
// ONLY call this when role === 'planner' — guard at component level too
const { data, error } = await supabase
  .from('financial_entries')
  .select('*')
  .eq('event_id', eventId)
  .order('category', { ascending: true })
  .order('sort_order', { ascending: true })
```

### Financial Summary (Computed Client-Side)
```typescript
const summary = entries.reduce((acc, entry) => ({
  totalBudget: acc.totalBudget + entry.total_amount,
  totalPaid: acc.totalPaid + entry.advance_paid,
  totalOutstanding: acc.totalOutstanding + entry.balance,
  unpaidCount: entry.payment_status === 'unpaid'
    ? acc.unpaidCount + 1
    : acc.unpaidCount
}), { totalBudget: 0, totalPaid: 0, totalOutstanding: 0, unpaidCount: 0 })
```

### Upsert Financial Entry
```typescript
const { error } = await supabase
  .from('financial_entries')
  .upsert({
    event_id: eventId,
    event_vendor_id: eventVendorId,
    vendor_name,
    description,
    category,
    quantity,
    total_amount: totalInKobo,
    advance_paid: advanceInKobo,
    payment_status,
    payment_date,
    notes
  })
```

---

## Live Board Queries

### Fetch Live Board Items
```typescript
const { data, error } = await supabase
  .from('live_board_items')
  .select('*, updated_by_profile:profiles(display_name, avatar_url)')
  .eq('event_id', eventId)
  .order('sort_order', { ascending: true })
```

### Update Station Status
```typescript
const { error } = await supabase
  .from('live_board_items')
  .update({
    status,
    status_label: statusLabel,
    updated_by: user.id
  })
  .eq('id', itemId)
```

### Subscribe to Live Board (Realtime)
```typescript
// In useLiveBoard hook
const channel = supabase
  .channel(`live_board:${eventId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'live_board_items',
      filter: `event_id=eq.${eventId}`
    },
    (payload) => {
      liveBoardStore.updateItem(payload.new as LiveBoardItem)
    }
  )
  .subscribe()

// Cleanup on unmount
return () => supabase.removeChannel(channel)
```

### Subscribe to Issues (Realtime)
```typescript
const channel = supabase
  .channel(`issues:${eventId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'issues',
      filter: `event_id=eq.${eventId}`
    },
    (payload) => {
      liveBoardStore.addIssue(payload.new as Issue)
      uiStore.showToast({
        type: 'warning',
        title: 'Issue Flagged',
        body: payload.new.title
      })
    }
  )
  .subscribe()
```

### Raise an Issue
```typescript
const { data, error } = await supabase
  .from('issues')
  .insert({
    event_id: eventId,
    board_item_id: boardItemId,
    title,
    description,
    severity,
    photo_url: photoUrl ?? null,
    raised_by: user.id
  })
  .select()
  .single()

// If severity is high or critical, auto-update board item status to red
if (['high', 'critical'].includes(severity)) {
  await supabase
    .from('live_board_items')
    .update({ status: 'red', status_label: `Issue: ${title}` })
    .eq('id', boardItemId)
}
```

---

## Task Queries

### Fetch Tasks for Event
```typescript
const { data, error } = await supabase
  .from('tasks')
  .select(`
    *,
    assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url)
  `)
  .eq('event_id', eventId)
  .order('due_datetime', { ascending: true })
```

### Update Task Status
```typescript
const { error } = await supabase
  .from('tasks')
  .update({
    status,
    completed_at: status === 'done' ? new Date().toISOString() : null
  })
  .eq('id', taskId)
```

---

## Guest Queries

### Bulk Import Guests from CSV
```typescript
// Parse CSV client-side first, then batch insert
const { error } = await supabase
  .from('guests')
  .insert(
    parsedGuests.map(g => ({
      event_id: eventId,
      first_name: g.first_name,
      last_name: g.last_name,
      phone: normalizePhone(g.phone), // convert to +234 format
      email: g.email,
      group_name: g.group,
      is_vip: g.vip === 'yes'
    }))
  )
```

### Check In a Guest
```typescript
const { error } = await supabase
  .from('guests')
  .update({
    checked_in: true,
    checked_in_at: new Date().toISOString()
  })
  .eq('id', guestId)
```

### Live Check-in Count
```typescript
const { count, error } = await supabase
  .from('guests')
  .select('id', { count: 'exact' })
  .eq('event_id', eventId)
  .eq('checked_in', true)
```

---

## Media Queries

### Upload Photo

Compression is context-dependent. Three tiers balance speed vs quality:

```typescript
import imageCompression from 'browser-image-compression'

// Profile/avatar photos — tiny, fast
function compressAvatar(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 400,
    useWebWorker: true,
  })
}

// Live board / issue photos — speed matters more than quality
function compressFast(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.15,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    initialQuality: 0.7,
  })
}

// General photos (site inspection, mood board, vendor work)
function compressStandard(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  })
}

// Aftermath / portfolio photos — quality matters most
function compressHQ(file: File) {
  return imageCompression(file, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    initialQuality: 0.85,
  })
}
```

```typescript
// Full upload flow
const compressed = await compressStandard(file)

const path = `${orgId}/${eventId}/${Date.now()}_${tag}.jpg`
const { data: storageData, error: storageError } = await supabase.storage
  .from('event-media')
  .upload(path, compressed)

const { data: { publicUrl } } = supabase.storage
  .from('event-media')
  .getPublicUrl(path)

const { error } = await supabase
  .from('media')
  .insert({
    event_id: eventId,
    uploader_id: user.id,
    url: publicUrl,
    storage_path: path,
    tag,
    phase_number: currentPhase,
    file_size: compressed.size,
  })
```

---

## Edge Functions

### /paystack-webhook
```typescript
// supabase/functions/paystack-webhook/index.ts
Deno.serve(async (req) => {
  const body = await req.text()
  const hash = crypto
    .createHmac('sha512', Deno.env.get('PAYSTACK_SECRET_KEY'))
    .update(body)
    .digest('hex')

  if (hash !== req.headers.get('x-paystack-signature')) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)

  if (event.event === 'charge.success') {
    const { metadata } = event.data
    // metadata.event_id set when initializing Paystack payment
    await supabaseAdmin
      .from('events')
      .update({
        status: 'active',
        payment_status: 'paid',
        paystack_ref: event.data.reference
      })
      .eq('id', metadata.event_id)
  }

  return new Response('OK', { status: 200 })
})
```

### /send-invite
```typescript
// supabase/functions/send-invite/index.ts
// Sends email invite to coordinator, vendor, or team member
// Uses Supabase Auth admin.generateLink() for magic links
Deno.serve(async (req) => {
  const { email, role, event_id, invited_by_name } = await req.json()

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { role, event_id }
    }
  })

  // Send via Supabase email or Resend (Phase 2)
  // ...

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

### /client-portal
```typescript
// supabase/functions/client-portal/index.ts
// Validates access token, returns safe event data for client
Deno.serve(async (req) => {
  const { token } = await req.json()

  const { data: portal } = await supabaseAdmin
    .from('client_portals')
    .select('event_id, is_active, expires_at')
    .eq('access_token', token)
    .single()

  if (!portal?.is_active) {
    return new Response('Invalid link', { status: 403 })
  }

  // Update last_accessed
  await supabaseAdmin
    .from('client_portals')
    .update({ last_accessed: new Date().toISOString() })
    .eq('access_token', token)

  // Fetch safe event data (no financials)
  const { data: event } = await supabaseAdmin
    .from('events')
    .select(`
      name, event_type, event_date, venue_name,
      event_phases(phase_number, phase_name, status, completed_at)
    `)
    .eq('id', portal.event_id)
    .single()

  return new Response(JSON.stringify(event), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

## Utility Functions

### Format Naira
```typescript
// lib/utils.ts
export function formatNaira(kobo: number): string {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

export function toKobo(naira: number): number {
  return Math.round(naira * 100)
}
```

### Normalize Nigerian Phone Number
```typescript
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('234')) return `+${digits}`
  if (digits.startsWith('0')) return `+234${digits.slice(1)}`
  if (digits.length === 10) return `+234${digits}`
  return phone // return as-is if unrecognized format
}
```

### Get Phase Name
```typescript
export const PHASE_NAMES: Record<number, string> = {
  1: 'Lead & Client Onboarding',
  2: 'Event Planning & Strategy',
  3: 'Vendor Management',
  4: 'Team Coordination',
  5: 'Guest Management',
  6: 'Pre-Event Finalization',
  7: 'Event Day Operations',
  8: 'Event Closeout',
  9: 'Post-Event Analysis'
}
```
