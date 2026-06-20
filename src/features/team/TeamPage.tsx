import { useEffect, useState } from 'react'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { Users, X, Mail, UserPlus, FileText, CheckCircle2, AlertTriangle, Clock, Send, Download, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { sendInvite } from '@/lib/edgeFunctions'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Tabs } from '@/components/ui/Tabs'
import type { Profile } from '@/types'
import { PageHero } from '@/components/shared/PageHero'
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

interface TeamReport {
  id: string
  actor_name: string | null
  description: string
  action_type: string
  created_at: string
  metadata: { status?: string; message?: string } | null
}

interface PendingInvitation {
  id: string
  email: string
  invited_by: string | null
  role: string
  status: string
  created_at: string
}

const ROLES = [
  { value: 'team_member', label: 'Team Member' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'client', label: 'Client' },
]

const REPORT_STATUS_OPTS = [
  { value: 'all_good', label: '✅ All Good' },
  { value: 'need_help', label: '⚠️ Need Help' },
  { value: 'blocked', label: '🔴 Blocked' },
  { value: 'update', label: '📝 General Update' },
]

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function reportStatusIcon(status?: string) {
  if (status === 'all_good') return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />
  if (status === 'need_help') return <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
  if (status === 'blocked') return <AlertTriangle size={14} style={{ color: 'var(--color-error)' }} />
  return <FileText size={14} style={{ color: 'var(--color-text-muted)' }} />
}

function reportStatusColor(status?: string) {
  if (status === 'all_good') return 'var(--color-success-bg)'
  if (status === 'need_help') return 'var(--color-warning-bg)'
  if (status === 'blocked') return 'var(--color-error-bg)'
  return 'var(--color-surface-3)'
}

export function TeamPage() {
  const { eventId } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const showNotification = useUIStore((s) => s.showModal)

  const [eventName, setEventName] = useState('')
  const [members, setMembers] = useState<TeamMemberRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('team_member')
  const [inviting, setInviting] = useState(false)
  const [addingExisting, setAddingExisting] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])

  /* ── Reports ── */
  const [reports, setReports] = useState<TeamReport[]>([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportStatus, setReportStatus] = useState('update')
  const [reportMessage, setReportMessage] = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'reports'>('members')
  const [confirmRemove, setConfirmRemove] = useState<{ type: 'member' | 'invite'; id: string; name: string } | null>(null)

  useEffect(() => {
    if (!eventId) return
    supabase.from('events').select('name').eq('id', eventId).single().then(({ data }) => { if (data) setEventName(data.name) })
    loadData()
  }, [eventId])

  async function loadData() {
    setLoading(true)

    try {
      const [{ data: membersData }, { data: tasksData }, { data: reportsData }, { data: invitationsData }] = await Promise.all([
      supabase
        .from('event_access')
        .select('*, profile:profiles!event_access_user_id_fkey(id, email, display_name, phone, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('id, assignee_id')
        .eq('event_id', eventId),
      supabase
        .from('event_activity')
        .select('id, actor_name, description, action_type, created_at, metadata')
        .eq('event_id', eventId)
        .eq('action_type', 'team_report')
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('invitations')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true }),
    ])

    if (membersData) setMembers(membersData as unknown as TeamMemberRow[])
    if (reportsData) setReports(reportsData as unknown as TeamReport[])
    if (invitationsData) setPendingInvitations(invitationsData as unknown as PendingInvitation[])

    const counts: Record<string, number> = {}
    if (tasksData) {
      for (const t of tasksData) {
        if (t.assignee_id) {
          counts[t.assignee_id] = (counts[t.assignee_id] || 0) + 1
        }
      }
    }
    setTaskCounts(counts)
    } catch (err) {
      console.error('Failed to load team data:', err)
    }

    setLoading(false)
  }

  function exportReportsCsv() {
    if (reports.length === 0) return
    const header = 'Date,Member,Status,Message'
    const rows = reports.map(r => {
      const date = new Date(r.created_at).toLocaleString('en-GB')
      const member = (r.actor_name || 'Unknown').replace(/,/g, ' ')
      const status = REPORT_STATUS_OPTS.find(o => o.value === r.metadata?.status)?.label.replace(/[^\w\s]/g, '').trim() || 'Update'
      const message = (r.description || '').replace(/"/g, '""')
      return `"${date}","${member}","${status}","${message}"`
    })
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `team-reports-${eventId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleSubmitReport() {
    if (!reportMessage.trim() || !eventId || !user) return

    setSubmittingReport(true)
    const actorName = profile?.display_name || user?.user_metadata?.display_name || user.email || 'Team member'
    const statusLabel = REPORT_STATUS_OPTS.find(o => o.value === reportStatus)?.label || 'Update'

    const { data, error } = await supabase
      .from('event_activity')
      .insert({
        event_id: eventId,
        actor_id: user.id,
        actor_name: actorName,
        action_type: 'team_report',
        description: reportMessage.trim(),
        metadata: { status: reportStatus, message: reportMessage.trim(), status_label: statusLabel },
      })
      .select()
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to submit report', message: error.message })
      setSubmittingReport(false)
      return
    }

    if (data) setReports([data as unknown as TeamReport, ...reports])
    showNotification({ variant: 'success', title: 'Report submitted', message: 'Your update has been sent to the planner.' })
    setReportMessage('')
    setReportStatus('update')
    setShowReportForm(false)
    setSubmittingReport(false)
  }

  async function handleInvite() {
    if (!inviteEmail.trim() || !eventId || !user) return

    setInviting(true)

    const { success, error } = await sendInvite({
      type: 'team_member',
      role: inviteRole,
      event_id: eventId,
      email: inviteEmail.trim(),
      invited_by_name: user.user_metadata?.full_name || user.email || 'A coordinator',
      invited_by: user.id,
    })

    if (!success) {
      showNotification({ variant: 'error', title: 'Invite failed', message: error || 'Could not send invite. Try again.' })
      setInviting(false)
      return
    }

    showNotification({ variant: 'success', title: 'Invite sent', message: `An invitation has been sent to ${inviteEmail.trim()}` })
    setInviteEmail('')
    setInviteRole('team_member')
    setShowInvite(false)
    setSearchQuery('')
    setSearchResults([])
    setShowEmailForm(false)
    setInviting(false)
  }

  async function handleAddExisting(userId: string) {
    if (!eventId || !userId) return
    setAddingExisting(userId)
    try {
      const { error } = await supabase
        .from('event_access')
        .upsert({ event_id: eventId, user_id: userId, role: inviteRole, accepted_at: new Date().toISOString() }, { onConflict: 'event_id,user_id' })
      if (error) {
        showNotification({ variant: 'error', title: 'Failed to add member', message: error.message })
      } else {
        showNotification({ variant: 'success', title: 'Member added', message: 'Team member has been added to this event.' })
        setShowInvite(false)
        setSearchQuery('')
        setSearchResults([])
        setShowEmailForm(false)
        loadData()
      }
    } catch (err) {
      showNotification({ variant: 'error', title: 'Failed to add member', message: 'An unexpected error occurred.' })
      console.error('Add member error:', err)
    }
    setAddingExisting(null)
  }

  async function handleRemoveMember(accessId: string) {
    const { error } = await supabase.from('event_access').delete().eq('id', accessId)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to remove member', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: 'Member removed' })
    setConfirmRemove(null)
    loadData()
  }

  async function handleCancelInvite(inviteId: string) {
    const { error } = await supabase.from('invitations').update({ status: 'cancelled' }).eq('id', inviteId)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to cancel invite', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: 'Invite cancelled' })
    setConfirmRemove(null)
    loadData()
  }

  async function handleSearch(query: string) {
    setSearchQuery(query)
    if (!query.trim()) { setSearchResults([]); return }
    setSearching(true)
    const existingIds = new Set(members.map(m => m.user_id).filter(Boolean))
    try {
      const { data } = await supabase.rpc('search_profiles', { search_query: query })
      if (data) {
        setSearchResults((data as Profile[]).filter(p => !existingIds.has(p.id)))
      }
    } catch (err) {
      console.error('Failed to search users:', err)
    }
    setSearching(false)
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}><h2 className={styles.headerTitle}>Team</h2></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
          <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading team...</div>
        </div>
      </div>
    )
  }

  const needsAttentionCount = reports.filter(r => r.metadata?.status === 'need_help' || r.metadata?.status === 'blocked').length

  return (
    <div className={styles.page}>
      <PageHero
        icon={Users}
        title={`Team${eventName ? ` | ${eventName}` : ''}`}
        subtitle={`${members.length} member${members.length !== 1 ? 's' : ''} · ${reports.length} report${reports.length !== 1 ? 's' : ''}`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {role !== 'planner' && (
              <button className="btn btn-secondary btn-sm" onClick={() => { setShowReportForm(true); setActiveTab('reports') }}>
                <Send size={14} />
                Submit Report
              </button>
            )}
            {(role === 'planner' || role === 'coordinator') && (
              <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowInvite(true)}>
                <UserPlus size={14} />
                Add Member
              </button>
            )}
          </div>
        }
      />

      {/* ── Attention strip ── */}
      {needsAttentionCount > 0 && (role === 'planner' || role === 'coordinator') && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-bg)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)', cursor: 'pointer' }} onClick={() => setActiveTab('reports')}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>{needsAttentionCount} report{needsAttentionCount !== 1 ? 's' : ''} need attention</span>
          <span style={{ color: 'var(--color-text-secondary)', marginLeft: 'auto', fontSize: 'var(--text-xs)' }}>View Reports →</span>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs
        tabs={[
          { key: 'members', label: 'Members', icon: <Users size={14} /> },
          {
            key: 'reports',
            label: 'Reports',
            icon: <FileText size={14} />,
            badge: reports.length > 0 ? (
              <span style={{ color: needsAttentionCount > 0 ? 'var(--color-warning)' : undefined }}>
                {reports.length}
              </span>
            ) : undefined,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* ── Members tab ── */}
      {activeTab === 'members' && (
        <div className={styles.tableCard}>
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead className={styles.thead}>
                <tr>
                  <th className={styles.th}>Member</th>
                  <th className={styles.th}>Role</th>
                  <th className={`${styles.th} ${styles.thTasks}`}>Tasks</th>
                  {(role === 'planner' || role === 'coordinator') && <th className={styles.th} style={{ width: 60 }} />}
                </tr>
              </thead>
              <tbody>
                    {members.length === 0 && pendingInvitations.length === 0 ? (
                  <tr>
                    <td className={styles.td} colSpan={(role === 'planner' || role === 'coordinator') ? 4 : 3}>
                      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                        <Users size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No team members yet</div>
                        <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Invite members to collaborate</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {members.map((member) => (
                      <tr key={member.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.memberCell}`}>
                          <div className={styles.memberInfo}>
                            <div className={styles.avatar}>
                              {member.profile?.display_name?.charAt(0)?.toUpperCase() || member.profile?.email?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <div className={styles.memberName}>{member.profile?.display_name || member.profile?.email?.split('@')[0] || 'Unnamed'}</div>
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
                        {(role === 'planner' || role === 'coordinator') && (
                          <td className={styles.td} style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ width: 32, height: 32, color: 'var(--color-text-muted)' }}
                              onClick={() => setConfirmRemove({ type: 'member', id: member.id, name: member.profile?.display_name || member.profile?.email || 'this member' })}
                              aria-label={`Remove ${member.profile?.display_name || member.profile?.email || 'member'}`}
                              title="Remove from event"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {pendingInvitations.map((inv) => (
                      <tr key={inv.id} className={styles.tr}>
                        <td className={`${styles.td} ${styles.memberCell}`}>
                          <div className={styles.memberInfo}>
                            <div className={styles.avatar}>
                              {inv.email.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className={styles.memberName}>{inv.email}</div>
                              <div className={styles.memberEmail}>Invited {timeAgo(inv.created_at)}</div>
                            </div>
                          </div>
                        </td>
                        <td className={styles.td}>
                          <span className="badge badge-grey">
                            <span className="badge-dot" />
                            Pending
                          </span>
                        </td>
                        <td className={`${styles.td} ${styles.cellCenter}`}>
                          <span className={styles.tasksCount}>&mdash;</span>
                        </td>
                        {(role === 'planner' || role === 'coordinator') && (
                          <td className={styles.td} style={{ textAlign: 'right' }}>
                            <button
                              className="btn btn-ghost btn-sm btn-icon"
                              style={{ width: 32, height: 32, color: 'var(--color-text-muted)' }}
                              onClick={() => setConfirmRemove({ type: 'invite', id: inv.id, name: inv.email })}
                              aria-label={`Cancel invite for ${inv.email}`}
                              title="Cancel invite"
                            >
                              <X size={14} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className={styles.tableFooter}>
            <span>Showing {members.length + pendingInvitations.length} member{(members.length + pendingInvitations.length) !== 1 ? 's' : ''}</span>
          </div>
        </div>
      )}

      {/* ── Reports tab ── */}
      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Planner view: export only */}
          {role === 'planner' && reports.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={exportReportsCsv}>
                <Download size={14} />
                Export CSV
              </button>
            </div>
          )}

          {/* Submit report form — non-planners only */}
          {role !== 'planner' && showReportForm && (
            <div className="card" style={{ borderLeft: '3px solid var(--color-accent)', padding: 'var(--space-5)' }}>
              <h3 style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 700 }}>
                <Send size={14} style={{ display: 'inline', marginRight: 8, color: 'var(--color-accent)' }} />
                Submit a Report
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <div className="input-wrapper">
                  <label className="input-label">Status</label>
                  <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                    {REPORT_STATUS_OPTS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setReportStatus(opt.value)}
                        style={{
                          padding: 'var(--space-2) var(--space-3)',
                          borderRadius: 'var(--radius-lg)',
                          border: `1px solid ${reportStatus === opt.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: reportStatus === opt.value ? 'var(--color-accent-muted)' : 'transparent',
                          color: reportStatus === opt.value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                          fontFamily: 'var(--font-base)',
                          fontSize: 'var(--text-xs)',
                          fontWeight: reportStatus === opt.value ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Message</label>
                  <textarea
                    className="input"
                    style={{ minHeight: 80, resize: 'vertical' }}
                    placeholder="What's your update? e.g. 'Catering confirmed, arriving at 3pm' or 'AV setup delayed by 30 mins, need backup'"
                    value={reportMessage}
                    onChange={(e) => setReportMessage(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSubmitReport} disabled={submittingReport || !reportMessage.trim()}>
                    <Send size={14} />
                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowReportForm(false)}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {role !== 'planner' && !showReportForm && (
            <button className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setShowReportForm(true)}>
              <Send size={14} />
              Submit a Report
            </button>
          )}

          {/* Reports feed */}
          {reports.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) var(--space-8)' }}>
              <div className="empty-state__icon"><FileText size={22} /></div>
              <div className="empty-state__title">No reports yet</div>
              <div className="empty-state__description">Team members can submit status updates here. Planners see everything in real time.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {reports.map(report => (
                <div
                  key={report.id}
                  className="card"
                  style={{
                    padding: 'var(--space-4)',
                    borderLeft: `3px solid ${report.metadata?.status === 'all_good' ? 'var(--color-success)' : report.metadata?.status === 'need_help' ? 'var(--color-warning)' : report.metadata?.status === 'blocked' ? 'var(--color-error)' : 'var(--color-border)'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)' }}>
                    <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', background: reportStatusColor(report.metadata?.status), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {reportStatusIcon(report.metadata?.status)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-1)', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{report.actor_name || 'Team member'}</span>
                        {report.metadata?.status && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 8px', borderRadius: 'var(--radius-full)', background: reportStatusColor(report.metadata.status), color: report.metadata.status === 'all_good' ? 'var(--color-success)' : report.metadata.status === 'need_help' ? 'var(--color-warning)' : report.metadata.status === 'blocked' ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                            {REPORT_STATUS_OPTS.find(o => o.value === report.metadata?.status)?.label || report.metadata.status}
                          </span>
                        )}
                        <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={11} />
                          {timeAgo(report.created_at)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Confirm remove ── */}
      {confirmRemove && (
        <div className={styles.overlay} onClick={() => setConfirmRemove(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {confirmRemove.type === 'invite' ? 'Cancel Invite' : 'Remove Member'}
              </h3>
              <button type="button" className={styles.modalClose} onClick={() => setConfirmRemove(null)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody} style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
              <AlertTriangle size={32} style={{ color: 'var(--color-warning)', marginBottom: 'var(--space-3)' }} />
              <p style={{ margin: '0 0 var(--space-1)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                {confirmRemove.type === 'invite' ? 'Cancel this invitation?' : `Remove ${confirmRemove.name}?`}
              </p>
              <p style={{ margin: '0 0 var(--space-5)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {confirmRemove.type === 'invite'
                  ? 'The pending invitation will be cancelled. They can be re-invited later.'
                  : 'They will lose access to this event and its tasks.'}
              </p>
              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    confirmRemove.type === 'invite'
                      ? handleCancelInvite(confirmRemove.id)
                      : handleRemoveMember(confirmRemove.id)
                  }
                >
                  <Trash2 size={14} />
                  {confirmRemove.type === 'invite' ? 'Cancel Invite' : 'Remove'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirmRemove(null)}>
                  Keep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Invite / Add modal ── */}
      {showInvite && (
        <div className={styles.overlay} onClick={() => { setShowInvite(false); setSearchQuery(''); setSearchResults([]); setShowEmailForm(false) }}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {showEmailForm ? 'Invite by Email' : 'Add Team Member'}
              </h3>
              <button type="button" className={styles.modalClose} onClick={() => { setShowInvite(false); setSearchQuery(''); setSearchResults([]); setShowEmailForm(false) }} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {showEmailForm ? (
                <>
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
                    <DropdownMenu
                      trigger={ROLES.find(r => r.value === inviteRole)?.label || inviteRole}
                      items={ROLES.map((r) => ({ label: r.label, value: r.value }))}
                      onSelect={(item) => setInviteRole(item.value)}
                    />
                  </div>
                  <div className={styles.modalActions}>
                    <button className="btn btn-primary btn-sm" onClick={handleInvite} disabled={inviting}>
                      <Mail size={14} />
                      {inviting ? 'Inviting...' : 'Send Invite'}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowEmailForm(false)}>Back</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setShowInvite(false); setSearchQuery(''); setSearchResults([]); setShowEmailForm(false) }}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="input-wrapper">
                    <label className="input-label">Search registered users</label>
                    <input
                      className="input"
                      type="text"
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {searching && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>Searching...</div>
                  )}

                  {!searching && searchQuery.trim() && searchResults.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <Users size={28} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>No users found</div>
                      <div style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--space-3)' }}>No registered user matches your search.</div>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setShowEmailForm(true); setInviteEmail(searchQuery) }}>
                        <Mail size={14} />
                        Send invite to "{searchQuery}"
                      </button>
                    </div>
                  )}

                  {!searching && searchResults.length > 0 && (
                    <>
                      <div className="input-wrapper" style={{ marginTop: 'var(--space-3)' }}>
                        <label className="input-label">Role for new members</label>
                        <DropdownMenu
                          trigger={ROLES.find(r => r.value === inviteRole)?.label || inviteRole}
                          items={ROLES.map((r) => ({ label: r.label, value: r.value }))}
                          onSelect={(item) => setInviteRole(item.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 300, overflowY: 'auto', marginTop: 'var(--space-2)' }}>
                        {searchResults.map((candidate) => (
                          <div
                            key={candidate.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
                              padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--color-border-subtle)',
                              background: 'var(--color-surface-3)',
                            }}
                          >
                            <div style={{
                              width: 34, height: 34, borderRadius: 'var(--radius-full)',
                              background: 'var(--color-accent-muted)', color: 'var(--color-accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 'var(--text-sm)', fontWeight: 700, flexShrink: 0,
                            }}>
                              {(candidate.display_name || candidate.email || '?')[0].toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{candidate.display_name || 'Unnamed'}</div>
                              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{candidate.email}</div>
                            </div>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ borderRadius: 'var(--radius-sm)', flexShrink: 0, whiteSpace: 'nowrap' }}
                              onClick={() => handleAddExisting(candidate.id)}
                              disabled={addingExisting === candidate.id}
                            >
                              {addingExisting === candidate.id ? 'Adding...' : <><Plus size={12} /> Add</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {!searchQuery.trim() && (
                    <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)' }}>
                      <Users size={32} style={{ marginBottom: 'var(--space-3)', opacity: 0.4 }} />
                      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Find a registered user</div>
                      <div style={{ fontSize: 'var(--text-xs)' }}>Search by name or email to add them directly — no invite needed.</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
