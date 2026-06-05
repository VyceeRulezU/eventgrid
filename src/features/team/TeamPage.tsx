import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Users, X, Mail, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import type { Profile } from '@/types'
import styles from './TeamPage.module.css'

interface TeamMemberRow {
  id: string
  user_id: string
  role: string
  invited_by: string | null
  accepted_at: string | null
  created_at: string
  profile: Pick<Profile, 'id' | 'email' | 'display_name' | 'phone' | 'avatar_url'> | null
}

const ROLES = ['team', 'coordinator', 'planner', 'vendor']

export function TeamPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const showNotification = useUIStore((s) => s.showModal)

  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('team')
  const [inviting, setInviting] = useState(false)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!eventId) return
    loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)

    const [{ data: membersData }, { data: tasksData }] = await Promise.all([
      supabase
        .from('event_access')
        .select('*, profile:profiles!event_access_user_id_fkey(id, email, display_name, phone, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, assignee_id')
        .eq('event_id', eventId),
    ])

    if (membersData) setMembers(membersData as unknown as TeamMemberRow[])

    const counts: Record<string, number> = {}
    if (tasksData) {
      for (const t of tasksData) {
        if (t.assignee_id) {
          counts[t.assignee_id] = (counts[t.assignee_id] || 0) + 1
        }
      }
    }
    setTaskCounts(counts)
    setLoading(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !eventId || !user) return

    setInviting(true)

    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail.trim())
      .maybeSingle()

    if (!profileData) {
      showNotification({ variant: 'error', title: 'User not found', message: 'No account with that email address exists.' })
      setInviting(false)
      return
    }

    const { error } = await supabase
      .from('event_access')
      .insert({
        event_id: eventId,
        user_id: profileData.id,
        role: inviteRole,
        invited_by: user.id,
      })
      .select()
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Invite failed', message: error.message })
      setInviting(false)
      return
    }

    showNotification({ variant: 'success', title: 'Member invited' })
    setInviteEmail('')
    setInviteRole('team')
    setShowInvite(false)
    setInviting(false)
    loadData()
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}><h2 className={styles.headerTitle}>Team</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading team...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Team</h2>
          <p className={styles.headerDesc}>{members.length} member{members.length !== 1 ? 's' : ''} on this event</p>
        </div>
        <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowInvite(true)}>
          <UserPlus size={14} />
          Invite Member
        </button>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>Member</th>
                <th className={styles.th}>Role</th>
                <th className={`${styles.th} ${styles.thTasks}`}>Tasks</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td className={styles.td} colSpan={3}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <Users size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No team members yet</div>
                      <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Invite members to collaborate</div>
                    </div>
                  </td>
                </tr>
              ) : members.map((member) => (
                <tr key={member.id} className={styles.tr}>
                  <td className={`${styles.td} ${styles.memberCell}`}>
                    <div className={styles.memberInfo}>
                      <div className={styles.avatar}>
                        {member.profile?.display_name?.charAt(0)?.toUpperCase() || member.profile?.email?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <div className={styles.memberName}>{member.profile?.display_name || 'Unnamed'}</div>
                        <div className={styles.memberEmail}>{member.profile?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <span className={`badge badge-${member.role === 'coordinator' ? 'yellow' : member.role === 'planner' ? 'green' : 'grey'}`}>
                      <span className="badge-dot" />
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </span>
                  </td>
                  <td className={`${styles.td} ${styles.cellCenter}`}>
                    <span className={styles.tasksCount}>{taskCounts[member.user_id] || 0} tasks</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableFooter}>
          <span>Showing {members.length} member{members.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {showInvite && (
        <div className={styles.overlay} onClick={() => setShowInvite(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Invite Team Member</h3>
              <button type="button" className={styles.modalClose} onClick={() => setShowInvite(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className="input-wrapper">
                <label className="input-label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="member@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                  autoFocus
                />
              </div>
              <div className="input-wrapper">
                <label className="input-label">Role</label>
                <select className="input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className={styles.modalActions}>
                <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting}>
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
