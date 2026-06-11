import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────────────

interface BaseInviteParams {
  event_id: string
  email: string
  invited_by_name: string
  invited_by?: string
}

interface TeamInviteParams extends BaseInviteParams {
  type: 'team_member'
  role?: string
}

interface VendorInviteParams extends BaseInviteParams {
  type: 'vendor'
  vendor_name: string
  service_name: string
  portal_link?: string
}

interface ClientPortalInviteParams extends BaseInviteParams {
  type: 'client_portal'
  client_name: string
  portal_link: string
  event_date?: string
}

interface CoordinatorInviteParams {
  type: 'coordinator_invite'
  email: string
  invited_by_name: string
  org_id: string
  org_name?: string
}

interface AdminInviteParams {
  type: 'admin_monitor'
  email: string
  invited_by_name: string
  role?: 'super_admin' | 'monitor' | 'admin_support'
}

interface GuestInviteParams extends BaseInviteParams {
  type: 'guest_invite'
  guest_name: string
}

export type SendInviteParams =
  | TeamInviteParams
  | VendorInviteParams
  | ClientPortalInviteParams
  | CoordinatorInviteParams
  | AdminInviteParams
  | GuestInviteParams


// ── Edge Function Caller ─────────────────────────────────────────────────────

/**
 * Calls the `send-invite` Supabase Edge Function.
 * Automatically attaches the current user's auth token.
 */
export async function sendInvite(params: SendInviteParams): Promise<{ success: boolean; error?: string }> {
  const { data, error } = await supabase.functions.invoke('send-invite', {
    body: params,
  })

  if (error) {
    console.error('sendInvite error:', error)
    let errMsg = error.message
    if (error.context) {
      try {
        // Clone response to safely read it
        const resClone = error.context.clone ? error.context.clone() : error.context
        const body = await resClone.json()
        if (body && body.error) {
          errMsg = body.error
        }
      } catch (e) {
        console.warn('Failed to parse error context json:', e)
      }
    }
    return { success: false, error: errMsg }
  }

  return { success: data?.success ?? false, error: data?.error }
}

/**
 * Fetches client portal data via the `client-portal` Edge Function.
 * Called from the ClientPortalPage — no auth required.
 */
export async function fetchClientPortal(token: string) {
  const { data, error } = await supabase.functions.invoke('client-portal', {
    body: { token },
  })

  if (error) {
    throw new Error(error.message ?? 'Portal unavailable')
  }

  if (data?.error) {
    throw new Error(data.error)
  }

  return data?.event ?? null
}

// ── AI Report Narrative ──────────────────────────────────────────────────────

export interface AiNarrativeInput {
  event: {
    name: string
    event_type: string | null
    event_date: string | null
    venue_name: string | null
    status: string
  }
  phases: { phase_number: number; phase_name: string; status: string }[]
  guestCount: number
  checkedIn: number
  totalBudget: number
  vendorCount: number
  issues: { title: string; severity: string; resolved_at: string | null; lessons_learned: string | null }[]
  issuesResolved: number
  mediaCount: number
  type: 'internal' | 'client'
}

export interface AiNarrativeResult {
  narrative: {
    executiveSummary: string
    highlights: string[]
    vendorNotes: string
    issueSummary: string
    recommendations: string[]
  }
}

export async function generateReportNarrative(input: AiNarrativeInput): Promise<AiNarrativeResult> {
  const { data, error } = await supabase.functions.invoke('generate-report-narrative', {
    body: input,
  })

  if (error) {
    console.error('generateReportNarrative error:', error)
    let errMsg = error.message
    if (error.context) {
      try {
        const resClone = error.context.clone ? error.context.clone() : error.context
        const body = await resClone.json()
        if (body && body.error) errMsg = body.error
      } catch {}
    }
    throw new Error(errMsg)
  }

  return data as AiNarrativeResult
}
