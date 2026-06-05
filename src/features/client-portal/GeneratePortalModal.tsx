import { useState } from 'react'
import { X, Copy, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './GeneratePortalModal.module.css'

interface GeneratePortalModalProps {
  eventId: string
  onClose: () => void
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function GeneratePortalModal({ eventId, onClose }: GeneratePortalModalProps) {
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const showNotification = useUIStore((s) => s.showNotification)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [hasExpiry, setHasExpiry] = useState(false)
  const [expiry, setExpiry] = useState('')
  const [saving, setSaving] = useState(false)
  const [portalId, setPortalId] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)

  const portalLink = token ? `${window.location.origin}/portal/${token}` : ''

  const handleSave = async () => {
    if (!name.trim() || !user) {
      showToast({ type: 'warning', title: 'Client name is required' })
      return
    }

    setSaving(true)
    const newToken = generateToken()

    const { data, error } = await supabase
      .from('client_portals')
      .insert({
        event_id: eventId,
        client_name: name,
        client_email: email || null,
        client_phone: phone || null,
        access_token: newToken,
        is_active: true,
        expires_at: hasExpiry && expiry ? new Date(expiry).toISOString() : null,
      })
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

        {!token ? (
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
                <input className="input" type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} style={{ marginTop: 'var(--space-2)' }} />
              )}
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave} disabled={saving}>
              {saving ? 'Creating...' : 'Generate Portal Link'}
            </button>
          </div>
        ) : (
          <div className={styles.body}>
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

            <button className="btn btn-destructive" style={{ width: '100%', marginTop: 'var(--space-3)' }} onClick={handleRevoke}>
              <AlertCircle size={14} /> Revoke Portal Access
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
