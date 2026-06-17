import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ChevronRight, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Onboarding.module.css'

export function TeamMemberOnboarding() {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [eventName, setEventName] = useState('')

  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const eventId = searchParams.get('event_id')
  const inviteRole = searchParams.get('role') || 'team_member'

  useEffect(() => {
    if (!eventId) {
      showToast({ type: 'error', title: 'Invalid Link', body: 'Missing event_id in invitation link.' })
      setInitializing(false)
      return
    }

    async function init() {
      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single()

      if (!eventData) {
        showToast({ type: 'error', title: 'Event Not Found', body: 'This event may have been deleted.' })
        setInitializing(false)
        return
      }

      setEventName(eventData.name)
      setInitializing(false)
    }

    if (user) init()
  }, [eventId, user])

  const handleAccept = async () => {
    if (!user || !eventId) return
    setLoading(true)

    const { error: accessErr } = await supabase
      .from('event_access')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        role: inviteRole,
        accepted_at: new Date().toISOString()
      }, { onConflict: 'event_id,user_id' })

    if (accessErr) {
      showToast({ type: 'error', title: 'Failed to join', body: accessErr.message })
      setLoading(false)
      return
    }

    if (user.email) {
      await supabase
        .from('invitations')
        .update({ status: 'accepted', accepted_at: new Date().toISOString() })
        .eq('event_id', eventId)
        .eq('email', user.email)
    }

    const { data: evtData } = await supabase
      .from('events')
      .select('org_id')
      .eq('id', eventId)
      .single()

    const higherRoles = ['super_admin', 'planner', 'coordinator']
    const currentRole = profile?.role
    const updateRole = !currentRole || !higherRoles.includes(currentRole)
    const updateOrgId = !profile?.org_id

    const profileUpdates: Record<string, unknown> = {}
    if (updateRole) profileUpdates.role = inviteRole
    if (updateOrgId) profileUpdates.org_id = evtData?.org_id || null
    if (!profile?.display_name) profileUpdates.display_name = user?.user_metadata?.display_name || user?.email?.split('@')[0] || null
    if (Object.keys(profileUpdates).length > 0) {
      await supabase.from('profiles').update(profileUpdates).eq('id', user.id)
    }

    if (profile) {
      setProfile({
        ...profile,
        ...(updateRole ? { role: inviteRole as import('@/types').UserRole } : {}),
        ...(updateOrgId ? { org_id: evtData?.org_id || null } : {}),
      })
    }

    showToast({ type: 'success', title: 'Joined!', body: `You've joined the team for ${eventName}.` })
    navigate('/dashboard/my-tasks')
    setLoading(false)
  }

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 56, height: 56, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading invitation...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <SEO title="Accept Invitation" description="Join an event team on NaliGrid." />
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/EventGrid-logo-white.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>
        </div>
        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Team Collaboration</div>
          <h1 className={styles.welcomeTitle}>You're invited!</h1>
          <p className={styles.welcomeDesc}>
            Join the team for <strong>{eventName}</strong> and start collaborating.
          </p>
        </div>
        <div className={styles.leftFooter}>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Terms</a>
            <a href="#" className={styles.footerLink}>Privacy</a>
          </div>
        </div>
      </div>
      <div className={styles.rightPanel}>
        <div className={styles.stepHeader}>
          <div className={styles.stepMeta}>
            <span className={styles.stepLabel}>Accept Invitation</span>
          </div>
        </div>
        <div className={styles.stepContent}>
          <div className={styles.infoBox}>
            <Sparkles size={16} className={styles.infoIcon} />
            <p style={{ margin: 0 }}>
              You've been invited to collaborate on: <strong style={{ color: 'var(--color-accent)' }}>{eventName}</strong>
            </p>
          </div>
          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              No onboarding required — just accept and start working
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              <Check size={18} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
              Update your profile anytime in settings
            </div>
          </div>
        </div>
        <div className={styles.navRow}>
          <button onClick={handleAccept} className={styles.continueBtn} disabled={loading}>
            {loading ? 'Joining…' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Accept &amp; Join <ChevronRight size={16} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
