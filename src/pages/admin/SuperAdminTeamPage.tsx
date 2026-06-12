import { useEffect, useState, useCallback } from 'react'
import { Users, UserPlus, X, Mail, Shield, ShieldCheck, Eye, Headset, Trash2, MoreVertical, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
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
  status: 'active'
  source: 'profile'
}

interface AdminInvite {
  id: string
  email: string
  role: string
  invited_by: string | null
  status: 'pending' | 'accepted' | 'cancelled'
  created_at: string
  source: 'invite'
}

type AdminEntry = AdminMember | AdminInvite

const roleIcon = (r: string) => {
  const found = ADMIN_ROLES.find(a => a.value === r)
  return found?.icon || Shield
}

const roleLabel = (r: string) => {
  return ADMIN_ROLES.find(a => a.value === r)?.label || r
}

export function SuperAdminTeamPage() {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [entries, setEntries] = useState<AdminEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('super_admin')
  const [inviting, setInviting] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)

    const [profilesRes, invitesRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, display_name, role, created_at, last_sign_in_at')
        .eq('is_super_admin', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('admin_invites')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    const all: AdminEntry[] = []

    if (profilesRes.data) {
      for (const m of profilesRes.data) {
        all.push({ ...m, status: 'active' as const, source: 'profile' as const })
      }
    }

    if (invitesRes.data) {
      for (const inv of invitesRes.data) {
        const alreadyActive = all.some(e => e.source === 'profile' && e.email === inv.email)
        if (!alreadyActive) {
          all.push({ ...inv, source: 'invite' as const })
        } else if (inv.status === 'accepted') {
          await supabase.from('admin_invites').delete().eq('id', inv.id)
        }
      }
    }

    setEntries(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

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
    loadData()
  }

  async function handleCancelInvite(inviteId: string) {
    showModal({
      variant: 'confirm',
      title: 'Cancel invite?',
      message: 'This will cancel the pending invitation. The recipient will no longer be able to accept.',
      actions: [
        { label: 'Keep Invite', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Cancel Invite',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase.from('admin_invites').update({ status: 'cancelled' }).eq('id', inviteId)
            if (error) {
              showNotification({ variant: 'error', title: 'Failed to cancel', message: error.message })
              return
            }
            showNotification({ variant: 'success', title: 'Invite cancelled' })
            loadData()
          },
        },
      ],
    })
  }

  async function handleDeleteInvite(inviteId: string) {
    showModal({
      variant: 'confirm',
      title: 'Remove invite?',
      message: 'This will permanently remove the invitation record.',
      actions: [
        { label: 'Keep', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Remove',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase.from('admin_invites').delete().eq('id', inviteId)
            if (error) {
              showNotification({ variant: 'error', title: 'Failed to remove', message: error.message })
              return
            }
            showNotification({ variant: 'success', title: 'Invite removed' })
            loadData()
          },
        },
      ],
    })
  }

  async function handleChangeRole(entry: AdminEntry, newRole: string) {
    if (entry.source === 'invite') {
      const { error } = await supabase.from('admin_invites').update({ role: newRole }).eq('id', entry.id)
      if (error) {
        showNotification({ variant: 'error', title: 'Failed to update role', message: error.message })
        return
      }
      showNotification({ variant: 'success', title: 'Role updated', message: `Invite role changed to ${roleLabel(newRole)}` })
    } else {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', entry.id)
      if (error) {
        showNotification({ variant: 'error', title: 'Failed to update role', message: error.message })
        return
      }
      await supabase.auth.admin.updateUserById(entry.id, {
        user_metadata: { ...(entry as AdminMember), role: newRole },
      })
      showNotification({ variant: 'success', title: 'Role updated', message: `${entry.email} is now ${roleLabel(newRole)}` })
    }
    loadData()
  }

  async function handleRemoveMember(memberId: string) {
    showModal({
      variant: 'confirm',
      title: 'Remove admin?',
      message: 'This will revoke all admin privileges from this user. They will become a regular platform user.',
      actions: [
        { label: 'Keep', variant: 'secondary' as const, onClick: () => {} },
        {
          label: 'Remove',
          variant: 'danger' as const,
          onClick: async () => {
            const { error } = await supabase.from('profiles').update({ is_super_admin: false }).eq('id', memberId)
            if (error) {
              showNotification({ variant: 'error', title: 'Failed to remove', message: error.message })
              return
            }
            showNotification({ variant: 'success', title: 'Admin removed' })
            loadData()
          },
        },
      ],
    })
  }

  const entriesWithoutCurrentUser = entries.filter(e => e.source !== 'profile' || e.id !== user?.id)

  if (loading) {
    return (
      <div className={styles.page}>
        <AdminPageHero icon={Shield} title="Admin Team" subtitle="Loading..." />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading admin team...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AdminPageHero
        icon={Shield}
        title="Admin Team"
        subtitle="Manage platform administrators"
        backTo="/admin"
        actions={
          role === 'super_admin' ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}>
              <UserPlus size={14} /> Invite Admin
            </button>
          ) : undefined
        }
      />

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Member</th>
                <th className={styles.th}>Role</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Invited / Joined</th>
                <th className={styles.th}>Last Active</th>
                <th className={styles.th} style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {entriesWithoutCurrentUser.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={6}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <Users size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No admin team configured</div>
                      <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Invite your first admin to get started</div>
                    </div>
                  </td>
                </tr>
              ) : entriesWithoutCurrentUser.map((entry) => {
                const isProfile = entry.source === 'profile'
                const Icon = roleIcon(entry.role)

                return (
                  <tr key={`${entry.source}-${entry.id}`} className={styles.tr}>
                    <td className={styles.td}>
                      <div className={styles.memberInfo}>
                        <div className={styles.avatar}>
                          {(isProfile
                            ? (entry as AdminMember).display_name || entry.email
                            : entry.email
                          ).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className={styles.memberName}>
                            {isProfile ? (entry as AdminMember).display_name || 'Unnamed' : entry.email}
                          </div>
                          <div className={styles.memberEmail}>{entry.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className={styles.td}>
                      <DropdownMenu
                        trigger={
                          <span className={`badge ${entry.role === 'super_admin' ? 'badge-yellow' : entry.role === 'monitor' ? 'badge-grey' : 'badge-blue'}`}
                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icon size={12} />
                            {roleLabel(entry.role)}
                          </span>
                        }
                        items={ADMIN_ROLES.map(r => ({
                          label: r.label,
                          value: r.value,
                          icon: <r.icon size={14} />,
                          disabled: r.value === entry.role,
                        }))}
                        onSelect={(item) => handleChangeRole(entry, item.value)}
                      />
                    </td>
                    <td className={styles.td}>
                      {isProfile ? (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Active
                        </span>
                      ) : entry.status === 'pending' ? (
                        <span className="badge badge-grey" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} /> Pending
                        </span>
                      ) : entry.status === 'cancelled' ? (
                        <span className="badge" style={{ background: 'var(--color-surface-3)', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <AlertTriangle size={12} /> Cancelled
                        </span>
                      ) : (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle size={12} /> Accepted
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      <span className={styles.cellMuted}>
                        {new Date(entry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <span className={styles.cellMuted}>
                        {isProfile
                          ? ((entry as AdminMember).last_sign_in_at
                            ? new Date((entry as AdminMember).last_sign_in_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                            : 'Never')
                          : '\u2014'}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {role === 'super_admin' && (
                        <DropdownMenu
                          trigger={
                            <button className="btn btn-ghost btn-sm btn-icon" aria-label="Actions" style={{ width: 28, height: 28 }}>
                              <MoreVertical size={14} />
                            </button>
                          }
                          items={[
                            ...(isProfile
                              ? [
                                {
                                  label: entry.role === 'super_admin' ? 'Downgrade to Monitor' : 'Upgrade to Super Admin',
                                  value: entry.role === 'super_admin' ? 'monitor' : 'super_admin',
                                  icon: <Shield size={14} />,
                                },
                                {
                                  label: 'Remove Admin',
                                  value: 'remove',
                                  icon: <Trash2 size={14} />,
                                  className: 'danger' as const,
                                },
                              ]
                              : entry.status === 'pending'
                                ? [
                                  {
                                    label: 'Cancel Invite',
                                    value: 'cancel',
                                    icon: <X size={14} />,
                                    className: 'danger' as const,
                                  },
                                  {
                                    label: 'Delete Invite',
                                    value: 'delete',
                                    icon: <Trash2 size={14} />,
                                    className: 'danger' as const,
                                  },
                                ]
                                : []),
                          ]}
                          onSelect={(item) => {
                            if (item.value === 'remove') handleRemoveMember(entry.id)
                            else if (item.value === 'cancel') handleCancelInvite(entry.id)
                            else if (item.value === 'delete') handleDeleteInvite(entry.id)
                            else handleChangeRole(entry, item.value)
                          }}
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className={styles.tableFooter}>
          <span>{entriesWithoutCurrentUser.length} admin{entriesWithoutCurrentUser.length !== 1 ? 's' : ''}</span>
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
              <div className="input-wrapper" style={{ overflow: 'visible' }}>
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
