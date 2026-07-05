import { useEffect, useState } from 'react'
import { X, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import type { ReferralPartner, ReferralPortal } from '@/types'

interface GenerateReferralPortalModalProps {
  partners: ReferralPartner[]
  defaultPartnerId?: string | null
  onClose: () => void
  onChanged: () => void
}

export function GenerateReferralPortalModal({ partners, defaultPartnerId, onClose, onChanged }: GenerateReferralPortalModalProps) {
  const showNotification = useUIStore((s) => s.showNotification)
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(defaultPartnerId || null)
  const [portal, setPortal] = useState<ReferralPortal | null>(null)
  const [checking, setChecking] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const selectedPartner = partners.find((p) => p.id === selectedPartnerId)

  useEffect(() => {
    if (!selectedPartnerId) {
      setPortal(null)
      setChecking(false)
      return
    }
    setChecking(true)
    supabase
      .from('referral_portals')
      .select('*')
      .eq('partner_id', selectedPartnerId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        setPortal(data)
        setChecking(false)
      })
  }, [selectedPartnerId])

  const portalLink = portal?.token ? `${window.location.origin}/portal/referral/${portal.token}` : ''

  const handleGenerate = async () => {
    if (!selectedPartnerId) return
    setSaving(true)
    const { data, error } = await supabase
      .from('referral_portals')
      .insert({ partner_id: selectedPartnerId })
      .select()
      .single()
    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      return
    }
    setPortal(data)
    showNotification({ variant: 'success', title: 'Portal link created' })
    onChanged()
  }

  const handleRegenerate = async () => {
    if (!portal?.id) return
    setSaving(true)
    const { data, error } = await supabase
      .from('referral_portals')
      .update({ token: crypto.randomUUID(), is_active: true, revoked_at: null })
      .eq('id', portal.id)
      .select()
      .single()
    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      return
    }
    setPortal(data)
    showNotification({ variant: 'success', title: 'New portal link generated' })
  }

  const handleRevoke = async () => {
    if (!portal?.id) return
    await supabase
      .from('referral_portals')
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq('id', portal.id)
    setPortal(null)
    showNotification({ variant: 'success', title: 'Portal link revoked' })
    onChanged()
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(portalLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const partnerOptions = partners.map((p) => ({
    label: `${p.name} (${p.code})`,
    value: p.id,
  }))

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-card-header">
          <h3 className="modal-card-title">Referral Portal Link</h3>
          <button className="modal-card-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="input-wrapper">
            <label className="input-label">Select Referral Code</label>
            <DropdownMenu
              trigger={<span>{selectedPartner ? `${selectedPartner.name} (${selectedPartner.code})` : 'Choose a code...'}</span>}
              items={partnerOptions}
              onSelect={(item) => { setSelectedPartnerId(item.value); setPortal(null) }}
            />
          </div>

          {checking && selectedPartnerId && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--space-4)' }}>
              Checking...
            </div>
          )}

          {!checking && selectedPartnerId && !portal && (
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerate} disabled={saving}>
              {saving ? 'Generating...' : 'Generate Portal Link'}
            </button>
          )}

          {!checking && portal && portalLink && (
            <>
              <div style={{
                background: 'var(--color-surface-3)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-4)',
              }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>Portal Link</div>
                <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
                  {portalLink}
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleCopy}>
                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => window.open(portalLink, '_blank')}>
                    <ExternalLink size={14} /> Open
                  </button>
                </div>
              </div>

              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={handleRegenerate} disabled={saving}>
                {saving ? 'Generating...' : 'Generate New Link'}
              </button>

              <button className="btn btn-destructive" style={{ width: '100%' }} onClick={handleRevoke}>
                <AlertCircle size={14} /> Revoke Portal Access
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}