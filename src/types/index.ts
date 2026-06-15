export type UserRole = 'planner' | 'coordinator' | 'vendor' | 'client' | 'team_member' | 'super_admin'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  org_id: string | null
  is_super_admin?: boolean
  is_active: boolean
  free_tier_used?: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  owner_id: string
  logo_url: string | null
  website: string | null
  instagram: string | null
  address: string | null
  city: string
  state: string | null
  show_beta_label: boolean
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  org_id: string
  created_by: string
  name: string
  event_type: string
  event_date: string | null
  end_date: string | null
  venue_name: string | null
  venue_address: string | null
  guest_count: number | null
  size_tier: 'intimate' | 'standard' | 'large' | null
  budget_total: number | null
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled'
  payment_status: 'unpaid' | 'paid'
  payment_provider: string | null
  amount_paid: number | null
  paid_at: string | null
  paystack_ref: string | null
  current_phase: number
  client_id: string | null
  coordinator_id: string | null
  notes: string | null
  slug: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export type PhaseStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked'

export interface EventPhase {
  id: string
  event_id: string
  phase_number: number
  phase_name: string
  status: PhaseStatus
  owner_id: string | null
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EventVendor {
  id: string
  event_id: string
  vendor_id: string | null
  vendor_name: string
  category: string
  service_desc: string | null
  quantity: number
  total_amount: number
  advance_paid: number
  balance: number
  payment_status: 'unpaid' | 'advance' | 'paid' | 'cancelled'
  booking_status: 'sourcing' | 'quoted' | 'negotiating' | 'confirmed' | 'paid' | 'cancelled'
  contract_url: string | null
  payment_date: string | null
  notes: string | null
  portal_user_id: string | null
  created_at: string
  updated_at: string
}

export interface Vendor {
  id: string
  org_id: string
  name: string
  category: string
  contact_name: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  rating: number | null
  notes: string | null
  is_verified: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface FinancialEntry {
  id: string
  event_id: string
  event_vendor_id: string | null
  vendor_name: string
  description: string
  category: string
  quantity: number
  total_amount: number
  advance_paid: number
  balance: number
  payment_status: 'unpaid' | 'advance' | 'paid'
  payment_date: string | null
  receipt_url: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  event_id: string
  phase_id: string | null
  title: string
  description: string | null
  assignee_id: string | null
  created_by: string
  due_datetime: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  message: string
  photo_urls: string[]
  created_at: string
}

export interface LiveFeedPost {
  id: string
  event_id: string
  user_id: string
  message: string
  photo_urls: string[]
  location_tag: string | null
  created_at: string
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Issue {
  id: string
  event_id: string
  board_item_id: string | null
  title: string
  description: string | null
  severity: IssueSeverity
  photo_url: string | null
  raised_by: string
  raised_at: string
  resolved_at: string | null
  resolution: string | null
  resolved_by: string | null
  lessons_learned: string | null
  created_at: string
}

export interface Guest {
  id: string
  event_id: string
  first_name: string
  last_name: string | null
  phone: string | null
  email: string | null
  rsvp_status: 'pending' | 'confirmed' | 'declined' | 'maybe'
  table_id: string | null
  seat_number: number | null
  is_vip: boolean
  group_name: string | null
  plus_one: boolean
  checked_in: boolean
  checked_in_at: string | null
  notes: string | null
  rsvp_note: string | null
  created_at: string
  updated_at: string
}

export interface SeatingTable {
  id: string
  event_id: string
  table_name: string
  capacity: number
  is_vip: boolean
  notes: string | null
  created_at: string
}

export interface Media {
  id: string
  event_id: string
  uploader_id: string
  url: string
  storage_path: string
  tag: string | null
  phase_number: number | null
  caption: string | null
  file_size: number | null
  created_at: string
}

export interface ClientPortal {
  id: string
  event_id: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  access_token: string
  is_active: boolean
  expires_at: string | null
  last_accessed: string | null
  created_at: string
}

export interface EventActivity {
  id: string
  event_id: string
  actor_id: string | null
  actor_name: string | null
  action_type: string
  description: string
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface Feedback {
  id: string
  user_id: string
  user_email: string
  user_role: string
  type: string
  subject: string
  message: string
  status: 'open' | 'in_review' | 'resolved' | 'closed'
  admin_reply: string | null
  replied_by: string | null
  replied_at: string | null
  created_at: string
  updated_at: string
}

export interface Notification {
  id: string
  user_id: string
  event_id: string | null
  type: string
  title: string
  body: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface RunSheetItem {
  id: string
  event_id: string
  time: string
  duration_mins: number
  title: string
  description: string | null
  owner: string | null
  status: 'pending' | 'in_progress' | 'done' | 'delayed' | 'skipped'
  actual_time: string | null
  notes: string | null
  sort_order: number
  created_at: string
  updated_at: string
}
