import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Sparkles, ChevronRight, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Onboarding.module.css'

export function TeamMemberOnboarding() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
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

  useEffect(() => {
    if (!eventId) {
      showToast({ type: 'error', title: 'Invalid Link', body: 'Missing event_id in invitation link.' })
      setInitializing(false)
      return
    }

    async function init() {
      // 1. Fetch event name
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('name')
        .eq('id', eventId)
        .single()

      if (eventErr || !eventData) {
        showToast({ type: 'error', title: 'Event Not Found', body: 'This event may have been deleted.' })
        setInitializing(false)
        return
      }

      setEventName(eventData.name)

      // 2. Pre-fill display name and phone from current profile
      if (profile) {
        setName(profile.display_name || '')
        setPhone(profile.phone || '')
      }

      setInitializing(false)
    }

    if (user) {
      init()
    }
  }, [eventId, user, profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSubmit = async () => {
    if (!user || !eventId) return
    setLoading(true)

    // 1. Create or verify event access record
    const { error: accessErr } = await supabase
      .from('event_access')
      .upsert({
        event_id: eventId,
        user_id: user.id,
        role: 'team_member',
        accepted_at: new Date().toISOString()
      }, { onConflict: 'event_id,user_id' })

    if (accessErr) {
      showToast({ type: 'error', title: 'Permission Grant Failed', body: accessErr.message })
      setLoading(false)
      return
    }

    // 2. Update profiles role and details
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({
        display_name: name,
        phone: phone || null,
        role: 'coordinator' // db role mapping
      })
      .eq('id', user.id)

    if (profileErr) {
      showToast({ type: 'error', title: 'Profile update failed', body: profileErr.message })
      setLoading(false)
      return
    }

    // Update local profile state
    if (profile) {
      setProfile({
        ...profile,
        display_name: name,
        phone: phone || null,
        role: 'coordinator'
      })
    }

    // 3. Mark onboarding completed in Auth metadata
    const { error: authErr } = await supabase.auth.updateUser({
      data: {
        onboarding_completed: true,
        joined_event_id: eventId
      }
    })

    if (authErr) {
      showToast({ type: 'error', title: 'Session sync failed', body: authErr.message })
    }

    showToast({ type: 'success', title: 'Access granted!', body: `You've joined the team for ${eventName}.` })
    navigate(`/events/${eventId}`)
    setLoading(false)
  }

  const handleNext = () => {
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Display Name Required', body: 'Please enter your display name.' })
      return
    }
    handleSubmit()
  }

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 56, height: 56, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Initializing team invitation...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <SEO title="Accept Team Invitation" description="Set up your profile and accept your invitation to join an event team on EventGrid." />
      {/* ── Left panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>
          <div className={styles.topRightActions}>
            <button onClick={handleLogout} className={styles.logoutBtn} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 'var(--text-xs)' }}>
              Log Out
            </button>
          </div>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Team Collaboration</div>
          <h1 className={styles.welcomeTitle}>You're invited to the team!</h1>
          <p className={styles.welcomeDesc}>
            Join colleagues and coordinate event delivery in real-time. Setup takes less than a minute.
          </p>
        </div>

        <div className={styles.leftTestimonial}>
          <div className={styles.testimonialCard}>
            <div className={styles.testimonialStars}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="currentColor" />
              ))}
            </div>
            <p className={styles.testimonialQuote}>
              "Using EventGrid's task boards and live sheets keeps our team completely aligned on logistics on event day."
            </p>
            <div className={styles.testimonialUser}>
              <div className={styles.testimonialAvatar}>AO</div>
              <div className={styles.testimonialDetails}>
                <span className={styles.testimonialName}>Amara Okoro</span>
                <span className={styles.testimonialRole}>Operations Lead, Nexus Events</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.leftFooter}>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Terms</a>
            <a href="#" className={styles.footerLink}>Privacy</a>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.stepHeader}>
          <div className={styles.stepMeta}>
            <span className={styles.stepLabel}>Accept Invitation</span>
            <div className={styles.stepper}>
              <div className={`${styles.stepDot} ${styles.stepDotActive}`} />
            </div>
          </div>
        </div>

        <div className={styles.stepContent}>
          <div className={styles.infoBox}>
            <Sparkles size={16} className={styles.infoIcon} />
            <p style={{ margin: 0 }}>
              You are accepting an invite to collaborate on the event: <strong style={{ color: 'var(--color-accent)' }}>{eventName || 'Loading...'}</strong>
            </p>
          </div>

          <h2 className={styles.question}>Complete your profile to join</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label className={styles.formLabel} htmlFor="name">
                Display Name / Full Name <span style={{ color: 'var(--color-error)' }}>*</span>
              </label>
              <input
                id="name"
                type="text"
                className={styles.inputField}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adebayo Benson"
                required
              />
            </div>

            <div>
              <label className={styles.formLabel} htmlFor="phone">
                Phone Number <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                className={styles.inputField}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 800 000 0000"
              />
            </div>
          </div>
        </div>

        <div className={styles.navRow}>
          <button
            onClick={handleNext}
            className={styles.continueBtn}
            disabled={loading || !name.trim()}
          >
            {loading ? 'Joining Team…' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Accept Invite &amp; Launch <ChevronRight size={16} />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
