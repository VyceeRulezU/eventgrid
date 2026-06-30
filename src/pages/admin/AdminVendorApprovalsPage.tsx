import { useEffect, useState } from 'react'
import { Shield, Check, X, RefreshCw, Mail, Phone, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import type { Vendor } from '@/types'

interface VendorClaim {
  id: string
  vendor_id: string
  user_id: string
  business_email: string | null
  business_phone: string | null
  proof_url: string | null
  status: string
  created_at: string
  vendor?: Vendor & { org_name?: string }
  profile?: { display_name: string | null; email: string | null }
}

export function AdminVendorApprovalsPage() {
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showNotification)

  const [pendingClaims, setPendingClaims] = useState<VendorClaim[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    load()
  }, [user])

  async function load() {
    setLoading(true)
    const claimRes = await supabase
      .from('vendor_claims')
      .select('*, vendor:vendors(*, organizations(name)), profile:profiles!vendor_claims_user_id_fkey(display_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (claimRes.data) {
      setPendingClaims(claimRes.data as unknown as VendorClaim[])
    }
    setLoading(false)
  }

  async function handleApprove(claim: VendorClaim) {
    setSaving(claim.id)
    const { error: claimError } = await supabase
      .from('vendor_claims')
      .update({ status: 'approved' })
      .eq('id', claim.id)

    if (claimError) {
      showNotification({ variant: 'error', title: 'Failed to approve claim', message: claimError.message })
      setSaving(null)
      return
    }

    const { error: vendorError } = await supabase
      .from('vendors')
      .update({
        is_verified: true,
        claimed_by_vendor_id: claim.user_id,
        verified_by_admin_id: user!.id,
        claim_verified_at: new Date().toISOString(),
      })
      .eq('id', claim.vendor_id)

    if (vendorError) {
      showNotification({ variant: 'error', title: 'Vendor update failed', message: vendorError.message })
      setSaving(null)
      return
    }

    setPendingClaims((prev) => prev.filter((c) => c.id !== claim.id))
    showNotification({ variant: 'success', title: 'Claim approved', message: 'The vendor is now verified and claimed.' })
    setSaving(null)
  }

  async function handleReject(claimId: string) {
    setSaving(claimId)
    const { error } = await supabase
      .from('vendor_claims')
      .update({ status: 'rejected' })
      .eq('id', claimId)

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to reject claim', message: error.message })
      setSaving(null)
      return
    }

    setPendingClaims((prev) => prev.filter((c) => c.id !== claimId))
    showNotification({ variant: 'success', title: 'Claim rejected', message: 'The ownership claim has been rejected.' })
    setSaving(null)
  }

  return (
    <div>
      <AdminPageHero
        icon={Shield}
        title="Vendor Approvals"
        subtitle="Review and approve vendor ownership claims"
        backTo="/admin"
        actions={
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading} style={{ gap: 'var(--space-1)' }}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div style={{ padding: 'var(--space-6)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: 120, borderRadius: 'var(--radius-md)' }} />
            ))}
          </div>
        ) : pendingClaims.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><Shield size={24} /></div>
            <div className="empty-state__title">No pending claims</div>
            <div className="empty-state__description">All vendor ownership claims have been reviewed. New vendor self-registrations are automatically verified.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{claim.vendor?.name || 'Unknown vendor'}</div>
                    <span className="badge badge-medium" style={{ marginTop: 4, fontSize: 'var(--text-xs)' }}>{claim.vendor?.category || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApprove(claim)}
                      disabled={saving === claim.id}
                      style={{ gap: 'var(--space-1)' }}
                    >
                      <Check size={14} /> {saving === claim.id ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      className="btn btn-destructive btn-sm"
                      onClick={() => handleReject(claim.id)}
                      disabled={saving === claim.id}
                      style={{ gap: 'var(--space-1)' }}
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Claimant</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Mail size={12} /> {claim.profile?.email || claim.business_email || '—'}
                    </span>
                    {claim.business_phone && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Phone size={12} /> {claim.business_phone}</span>
                    )}
                    {claim.proof_url && (
                      <a href={claim.proof_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)' }}>
                        <ExternalLink size={12} /> Proof
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
