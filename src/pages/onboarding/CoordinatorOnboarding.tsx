import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Info, Sparkles, ChevronRight, LogOut, ArrowLeft, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Onboarding.module.css'

const STEP_LABELS = ['Your Profile', 'Specialization']

export function CoordinatorOnboarding() {
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialization, setSpecialization] = useState('logistics')

  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // If coming via coordinator invite link, org_id is in the URL
  const inviteOrgId = searchParams.get('org_id')

  const TOTAL_STEPS = 2

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    const updatePayload: Record<string, unknown> = {
      display_name: name,
      phone,
    }

    // If joining via invite, assign to org and set role
    if (inviteOrgId) {
      updatePayload.org_id = inviteOrgId
      updatePayload.role = 'coordinator'
    }

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', user.id)

    if (error) {
      showToast({ type: 'error', title: 'Update failed', body: error.message })
      setLoading(false)
      return
    }

    showToast({ type: 'success', title: 'Profile completed!', body: 'Welcome to the EventGrid team.' })
    navigate('/dashboard/coordinator')
    setLoading(false)
  }


  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      showToast({ type: 'error', title: 'Display Name Required', body: 'Please enter your display name.' })
      return
    }
    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  return (
    <div className={styles.container}>
      <SEO title="Coordinator Onboarding" description="Set up your coordinator profile and area of event day expertise on EventGrid." />
      {/* ── Left panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>
          <div className={styles.topRightActions}>
            <Link to="/" className={styles.backToSite}>
              <ArrowLeft size={14} />
              Back to website
            </Link>
          </div>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Coordinator Setup</div>
          <h1 className={styles.welcomeTitle}>Complete your profile</h1>
          <p className={styles.welcomeDesc}>
            Let event planners know your availability and skillsets. Start receiving task assignments and schedules in minutes.
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
              "EventGrid keeps my event day tasks completely organized. I can view the timeline on my phone and update checklists in real-time."
            </p>
            <div className={styles.testimonialUser}>
              <div className={styles.testimonialAvatar}>TA</div>
              <div className={styles.testimonialDetails}>
                <span className={styles.testimonialName}>Tobi Adeleke</span>
                <span className={styles.testimonialRole}>Lead Day-of Coordinator</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.leftFooter}>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>Terms</a>
            <a href="#" className={styles.footerLink}>Privacy Policy</a>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={12} /> Log Out
          </button>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className={styles.rightPanel}>
        <div className={styles.stepHeader}>
          <div className={styles.stepMeta}>
            <span className={styles.stepLabel}>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</span>
            <div className={styles.stepper}>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <div
                  key={i}
                  className={`${styles.stepDot} ${i + 1 === step ? styles.stepDotActive : styles.stepDotInactive}`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.stepContent} key={step}>

          {step === 1 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Your display name and phone number will be shared with the event planners and team members you coordinate with.
                </p>
              </div>

              <h2 className={styles.question}>Introduce yourself</h2>

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
                    placeholder="e.g. Tobi Adeleke"
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
          )}

          {step === 2 && (
            <div>
              <div className={styles.infoBox}>
                <Sparkles size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Planners search for coordinators based on specialty. Choosing a focus helps match you to the right events and roles.
                </p>
              </div>

              <h2 className={styles.question}>Select your primary coordination specialization</h2>

              <div className={styles.optionList}>
                {[
                  { id: 'logistics', title: 'Venue Operations & Logistics', desc: 'Managing loading schedules, setup verification, and vendor layouts' },
                  { id: 'guest_services', title: 'Guest Services & Seating', desc: 'Overseeing registrations, usher protocols, seating, and VIP security' },
                  { id: 'stage_management', title: 'Stage Management & Show Control', desc: 'Timing MC cues, audiovisual setups, speaker lineups, and live schedule' },
                  { id: 'general_operations', title: 'All-Round Event Coordinator', desc: 'Managing any checklist item required to run a successful event day' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    className={`${styles.optionCard} ${specialization === opt.id ? styles.optionCardActive : ''}`}
                    onClick={() => setSpecialization(opt.id)}
                  >
                    <div className={styles.optionDetails}>
                      <span className={styles.optionTitle}>{opt.title}</span>
                      <span className={styles.optionDesc}>{opt.desc}</span>
                    </div>
                    <div className={styles.radioIndicator}>
                      <div className={styles.radioIndicatorInner} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className={styles.navRow}>
          {step > 1 && (
            <button onClick={handleBack} className={styles.stepBackBtn} disabled={loading}>
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            className={styles.continueBtn}
            disabled={loading || (step === 1 && !name.trim())}
          >
            {loading ? 'Saving Details…' : step === TOTAL_STEPS ? 'Complete Profile' : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                Continue <ChevronRight size={16} />
              </span>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
