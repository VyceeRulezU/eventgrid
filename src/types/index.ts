export type UserRole = 'planner' | 'coordinator' | 'vendor' | 'client' | 'team_member' | 'super_admin' | 'admin_monitor' | 'admin_support'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  org_id: string | null
  is_super_admin?: boolean
  original_role?: string | null
  is_active: boolean
  free_tier_used?: boolean
  referred_by_code?: string | null
  push_enabled?: boolean
  push_tasks?: boolean
  push_issues?: boolean
  push_vendors?: boolean
  push_payments?: boolean
  push_client_actions?: boolean
  created_at: string
  updated_at: string
}

export interface ReferralPartner {
  id: string
  name: string
  code: string
  email: string | null
  phone: string | null
  commission_type: 'per_activation' | 'percentage'
  commission_amount: number
  is_active: boolean
  notes: string | null
  created_at: string
}

export interface ReferralRedemption {
  id: string
  partner_id: string
  referred_user_id: string
  event_id: string | null
  commission_amount: number
  status: 'pending' | 'paid' | 'cancelled'
  activated_at: string | null
  paid_at: string | null
  created_at: string
}

export interface ReferralPortal {
  id: string
  partner_id: string
  token: string
  is_active: boolean
  created_at: string
  revoked_at: string | null
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
  status: 'draft' | 'active' | 'in_progress' | 'completed' | 'cancelled' | 'archived'
  payment_status: 'unpaid' | 'paid'
  payment_provider: string | null
  amount_paid: number | null
  paid_at: string | null
  paystack_ref: string | null
  current_phase: number
  client_id: string | null
  managing_planner_id: string | null
  coordinator_id: string | null
  notes: string | null
  slug: string | null
  header_image_url: string | null
  archived_at: string | null
  archived_until: string | null
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
  org_id: string | null
  name: string
  category: string
  contact_name: string | null
  phone: string | null
  email: string | null
  instagram: string | null
  rating: number | null
  notes: string | null
  is_verified: boolean
  claimed_by_vendor_id: string | null
  claimed_at: string | null
  claim_verified_at: string | null
  verified_by_admin_id: string | null
  website: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface VendorClaim {
  id: string
  vendor_id: string
  user_id: string
  business_email: string | null
  business_phone: string | null
  proof_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface VendorEditSuggestion {
  id: string
  vendor_id: string
  suggested_by: string
  suggested_data: {
    name?: string
    category?: string
    contact_name?: string | null
    phone?: string | null
    email?: string | null
    instagram?: string | null
    website?: string | null
    notes?: string | null
  }
  status: 'pending' | 'approved' | 'rejected'
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
  parent_id: string | null
  created_at: string
  likes_count?: number
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
  x: number
  y: number
  width: number
  height: number
  rotation: number
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

export interface Lead {
  id: string
  org_id: string | null
  event_id: string | null
  created_by: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  source: 'referral' | 'website' | 'social' | 'walk_in' | 'email' | 'call' | 'other'
  status: 'new' | 'contacted' | 'qualified' | 'proposal_sent' | 'negotiating' | 'converted' | 'lost'
  notes: string | null
  budget_range: string | null
  event_type: string | null
  preferred_date: string | null
  guest_count_estimate: number | null
  converted_to_event_id: string | null
  created_at: string
  updated_at: string
}
export interface ProposalSection {
  category?: string
  title: string
  description?: string
  amount?: number
  items?: { description: string; amount: number }[]
}

export interface Proposal {
  id: string
  event_id: string | null
  lead_id: string | null
  org_id: string | null
  created_by: string
  title: string
  description: string | null
  valid_until: string | null
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  sections: ProposalSection[]
  total_amount: number
  sent_at: string | null
  viewed_at: string | null
  responded_at: string | null
  notes: string | null
  client_email: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  description: string
  quantity: number
  unit_price: number
  amount: number
}

export interface Invoice {
  id: string
  event_id: string
  org_id: string | null
  created_by: string
  invoice_number: string
  client_name: string | null
  client_email: string | null
  items: InvoiceItem[]
  subtotal: number
  discount: number
  total: number
  amount_paid: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string | null
  issued_date: string
  paid_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface EventChatMessage {
  id: string
  event_id: string
  user_id: string
  message: string
  created_at: string
}

export interface Checklist {
  id: string
  event_id: string
  phase_id: string | null
  created_by: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  checklist_id: string
  text: string
  is_checked: boolean
  checked_by: string | null
  checked_at: string | null
  sort_order: number
  created_at: string
}

export interface EventNote {
  id: string
  event_id: string
  created_by: string
  title: string
  content: string
  category: 'general' | 'ideas' | 'todo' | 'notes' | 'important'
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export interface Questionnaire {
  id: string
  event_id: string | null
  org_id: string | null
  created_by: string
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface QuestionnaireQuestion {
  id: string
  questionnaire_id: string
  question_text: string
  question_type: 'text' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating'
  options: string[]
  is_required: boolean
  sort_order: number
  created_at: string
}

export interface QuestionnaireResponse {
  id: string
  questionnaire_id: string
  event_id: string | null
  respondent_name: string
  respondent_email: string | null
  answers: Record<string, string | string[]>
  submitted_at: string
}

export interface GuestMessage {
  id: string
  event_id: string
  subject: string
  body: string
  sent_by: string
  recipient_filter: 'all' | 'vip' | 'pending_rsvp' | 'confirmed' | 'declined' | 'maybe' | 'checked_in'
  sent_count: number
  opened_count: number
  created_at: string
}

// ── Vendor Quote Requests ─────────────────────────────────
export type VendorQuoteRequestStatus = 'open' | 'closed' | 'cancelled'
export type VendorQuoteInvitationStatus = 'pending' | 'declined' | 'quoted'
export type VendorQuoteStatus = 'submitted' | 'accepted' | 'rejected' | 'revised'

export interface VendorQuoteRequest {
  id: string
  event_id: string
  org_id: string | null
  created_by: string
  title: string
  description: string | null
  category: string | null
  budget_range_min: number | null
  budget_range_max: number | null
  response_deadline: string | null
  status: VendorQuoteRequestStatus
  created_at: string
  updated_at: string
}

export interface VendorQuoteInvitation {
  id: string
  quote_request_id: string
  vendor_id: string
  status: VendorQuoteInvitationStatus
  created_at: string
}

export interface VendorQuote {
  id: string
  quote_request_id: string
  vendor_id: string
  amount: number | null
  description: string | null
  line_items: { title: string; description: string; amount: number }[]
  notes: string | null
  status: VendorQuoteStatus
  created_at: string
  updated_at: string
}

// ── Client Quote Requests ─────────────────────────────────
export type ClientQuoteRequestStatus = 'open' | 'negotiating' | 'closed' | 'cancelled'
export type ClientQuoteResponseStatus = 'pending' | 'accepted' | 'declined'

export interface ClientQuoteRequest {
  id: string
  client_id: string
  event_id: string | null
  title: string
  description: string | null
  event_type: string | null
  event_date: string | null
  guest_count: number | null
  budget_range: string | null
  preferred_roles: string[]
  status: ClientQuoteRequestStatus
  created_at: string
  updated_at: string
}

export interface ClientQuoteResponse {
  id: string
  quote_request_id: string
  respondent_id: string
  respondent_role: 'planner' | 'coordinator' | 'vendor'
  message: string | null
  estimated_amount: number | null
  portfolio_links: string[]
  status: ClientQuoteResponseStatus
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  type: 'event' | 'task_due' | 'phase_due' | 'vendor_payment'
  event_id?: string
  status?: string
  color?: string
}
