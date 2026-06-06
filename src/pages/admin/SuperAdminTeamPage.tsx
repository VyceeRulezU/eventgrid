import { useEffect, useState } from 'react'
import { Users, UserPlus, X, Mail, Shield, ShieldCheck, Eye, Headset } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { sendInvite } from '@/lib/edgeFunctions'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import styles from './SuperAdminTeamPage.module.css'

const ADMIN_ROLES = [
  { value: 'super_admin', label: 'Super Admin', icon: ShieldCheck, desc: 'Full platform-wide access' },
  { value: 'monitor', label: 'Monitor', icon: Eye, desc: 'Read-only analytics and data viewing' },
  { value: 'admin_support', label: 'Support', icon: Headset, desc: 'Manage feedback and platform users' },
]

interface AdminMember {
  id: string
  email: string
  display_name: string | null
  role: string
  created_at: string
  last_sign_in_at: string | null
}

export function SuperAdminTeamPage() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showNotification = useUIStore((s) => s.showNotification)

  const [members, setMembers] = useState<AdminMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('super_admin')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    loadMembers()
  }, [])

  async function loadMembers() {
    const superEmails = (import.meta.env.VITE_SUPER_ADMIN_EMAILS as string | undefined) || ''
    const emails = superEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    if (emails.length === 0) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, email, display_name, role, created_at, last_sign_in_at')
      .in('email', emails)
      .order('created_at', { ascending: false })

    if (data) setMembers(data as AdminMember[])
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !user) return

    setInviting(true)

    const displayName = profile?.display_name || user?.user_metadata?.display_name || 'A super admin'

    const { success, error } = await sendInvite({
      type: 'admin_monitor',
      email: inviteEmail.trim(),
      invited_by_name: displayName,
      role: inviteRole as 'super_admin' | 'monitor' | 'admin_support',
    })

    if (!success) {
      showNotification({ variant: 'error', title: 'Invite failed', message: error || 'Could not send invite. Try again.' })
      setInviting(false)
      return
    }

    showNotification({ variant: 'success', title: 'Invite sent', message: `An invitation has been sent to ${inviteEmail.trim()}` })
    setInviteEmail('')
    setShowInvite(false)
    setInviting(false)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}><h2 className={styles.headerTitle}>Admin Team</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading admin team...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 2 }}>
            <Shield size={20} style={{ color: 'var(--color-accent)' }} />
            <h2 className={styles.headerTitle}>Admin Team</h2>
          </div>
          <p className={styles.headerDesc}>{members.length} admin{members.length !== 1 ? 's' : ''} with platform access</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowInvite(true)}>
          <UserPlus size={14} />
          Invite Admin
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Admin</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Joined</th>
                <th className={styles.th}>Last Active</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={4}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <Users size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No admin team configured</div>
                      <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Add emails to VITE_SUPER_ADMIN_EMAILS env var</div>
                    </div>
                  </td>
                </tr>
              ) : members.map((m) => (
                <tr key={m.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.memberInfo}>
                      <div className={styles.avatar}>
                        {(m.display_name || m.email).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.memberName}>{m.display_name || 'Unnamed'}</div>
                        <div className={styles.memberEmail}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className="badge badge-yellow">
                      <span className="badge-dot" />
                      Super Admin
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>
                      {new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className={styles.td}>
                    <span className={styles.cellMuted}>
                      {m.last_sign_in_at
                        ? new Date(m.last_sign_in_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Never'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>Showing {members.length} admin{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {showInvite && (
        <div className="overlay" onClick={() => setShowInvite(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">Invite Admin Team Member</h3>
              <button type="button" className="modal-card-close" onClick={() => setShowInvite(false)} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body">
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-4)' }}>
                Send an invitation to grant platform-wide admin access. The recipient will receive an email with a registration link.
              </p>
              <div className="input-wrapper">
                <label className="input-label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="admin@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  autoFocus
                />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Admin Role</label>
                <DropdownMenu
                  trigger={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {(() => {
                        const r = ADMIN_ROLES.find(r => r.value === inviteRole)
                        const Icon = r?.icon || ShieldCheck
                        return <><Icon size={16} />{r?.label || 'Super Admin'}</>
                      })()}
                    </span>
                  }
                  items={ADMIN_ROLES.map(r => ({
                    label: r.label,
                    value: r.value,
                    icon: <r.icon size={16} />,
                  }))}
                  onSelect={(item) => setInviteRole(item.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  <Mail size={14} />
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
