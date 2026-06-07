import { useEffect, useState } from 'react'
import { X, Copy, Check, AlertCircle, ExternalLink, RefreshCw, CalendarDays } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { CalendarModal } from '@/components/ui/CalendarModal'
import styles from './GeneratePortalModal.module.css'

interface GeneratePortalModalProps {
  eventId: string
  onClose: () => void
}

function generateToken(name: string): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${slug}-${suffix}`
}

export function GeneratePortalModal({ eventId, onClose }: GeneratePortalModalProps) {
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const showNotification = useUIStore((s) => s.showNotification)

  const [checking, setChecking] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [portalId, setPortalId] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)
  const [showExpiryPicker, setShowExpiryPicker] = useState(false)

  const portalLink = token ? `${window.location.origin}/portal/${token}` : ''

  // Load any existing active portal on mount
  useEffect(() => {
    supabase
      .from('client_portals')
      .select('*')
      .eq('event_id', eventId)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setPortalId(data.id)
          setToken(data.access_token)
          setName(data.client_name ?? '')
          setEmail(data.client_email ?? '')
          setPhone(data.client_phone ?? '')
        }
        setChecking(false)
      })
  }, [eventId])

  const handleSave = async () => {
    if (!name.trim() || !user) {
      showToast({ type: 'warning', title: 'Client name is required' })
      return
    }

    setSaving(true)
    const newToken = generateToken(name)

    // upsert on event_id — works for both first-time create and regenerate
    const { data, error } = await supabase
      .from('client_portals')
      .upsert(
        {
          event_id: eventId,
          client_name: name,
          client_email: email || null,
          client_phone: phone || null,
          access_token: newToken,
          is_active: true,
          expires_at: hasExpiry && expiry ? new Date(expiry).toISOString() : null,
        },
        { onConflict: 'event_id' }
      )
      .select()
      .single()

    if (error) {
      showToast({ type: 'error', title: 'Failed to create portal', body: error.message })
      setSaving(false)
      return
    }

    setToken(newToken)
    setPortalId(data.id)
    setSaving(false)
    showNotification({ variant: 'success', title: 'Portal link created', duration: 2000 })
  }

  const handleRegenerate = async () => {
    if (!portalId || !name.trim()) return
    setSaving(true)
    const newToken = generateToken(name)

    const { error } = await supabase
      .from('client_portals')
      .update({ access_token: newToken, is_active: true })
      .eq('id', portalId)

    if (error) {
      showToast({ type: 'error', title: 'Failed to regenerate link', body: error.message })
      setSaving(false)
      return
    }

    setToken(newToken)
    setSaving(false)
    showNotification({ variant: 'success', title: 'New portal link generated', duration: 2000 })
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(portalLink).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleRevoke = async () => {
    if (!portalId) return
    await supabase.from('client_portals').update({ is_active: false }).eq('id', portalId)
    setPortalId(null)
    setToken('')
    showToast({ type: 'success', title: 'Portal link revoked' })
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Client Portal Access</h3>
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        </div>

        {checking ? (
          <div className={styles.body} style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
            <span className="spinner-loader" />
          </div>
        ) : !token ? (
          /* ── Create form ── */
          <div className={styles.body}>
            <div className="input-wrapper" style={{ marginBottom: 'var(--space-3)' }}>
              <label className="input-label">Client Name *</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chioma Johnson" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
              <div className="input-wrapper">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@example.com" />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Phone</label>
                <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234..." />
              </div>
            </div>

            <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={hasExpiry} onChange={(e) => setHasExpiry(e.target.checked)} />
                Set expiry date
              </label>
              {hasExpiry && (
                <>
                  <button
                    type="button"
                    className="input"
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)', cursor: 'pointer', justifyContent: 'flex-start' }}
                    onClick={() => setShowExpiryPicker(true)}
                  >
                    <CalendarDays size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    <span style={{ color: expiry ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                      {expiry
                        ? new Date(expiry + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Select expiry date'}
                    </span>
                  </button>
                  <CalendarModal
                    open={showExpiryPicker}
                    value={expiry}
                    onChange={(d) => { setExpiry(d); setShowExpiryPicker(false) }}
                    onClose={() => setShowExpiryPicker(false)}
                  />
                </>
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Creating...' : 'Generate Portal Link'}
            </button>
          </div>
        ) : (
          /* ── Existing / just-created portal ── */
          <div className={styles.body}>
            {name && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                Active portal for <strong style={{ color: 'var(--color-text-primary)' }}>{name}</strong>
              </div>
            )}

            <div className={styles.linkCard}>
              <div className={styles.linkLabel}>Portal Link</div>
              <div className={styles.linkValue}>{portalLink}</div>
              <div className={styles.linkActions}>
                <button className="btn btn-primary btn-sm" onClick={handleCopy} style={{ flex: 1 }}>
                  {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => window.open(portalLink, '_blank')} style={{ flex: 1 }}>
                  <ExternalLink size={14} /> Open
                </button>
              </div>
            </div>

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: 'var(--space-3)' }}
              onClick={handleRegenerate}
              disabled={saving}
            >
              <RefreshCw size={14} /> {saving ? 'Generating...' : 'Generate New Link'}
            </button>

            <button className="btn btn-destructive" style={{ width: '100%', marginTop: 'var(--space-2)' }} onClick={handleRevoke}>
              <AlertCircle size={14} /> Revoke Portal Access
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
