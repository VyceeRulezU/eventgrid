import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Sparkles, ChevronRight, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import styles from './Onboarding.module.css'

export function CoordinatorOnboarding() {
  const [step, setStep] = useState(1)

  // Form States
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [specialization, setSpecialization] = useState('logistics')

  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: name,
        phone,
        user_metadata: {
          ...user.user_metadata,
          coordinator_specialization: specialization,
          onboarding_completed: true
        }
      })
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
    if (step < 2) {
      setStep((prev) => prev + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1)
    }
  }

  return (
    <div className={styles.container}>
      {/* Left branding welcome panel */}
      <div className={styles.leftPanel}>
        <div className={styles.branding}>
          <div className={styles.brandLogo}>EG</div>
          <span className={styles.brandName}>EventGrid</span>
        </div>

        <div className={styles.leftContent}>
          <div className={styles.welcomeTag}>Coordinator Setup</div>
          <h1 className={styles.welcomeTitle}>Complete your profile</h1>
          <p className={styles.welcomeDesc}>
            Let event planners know your availability and skillsets. Set up your display details to start receiving task assignments and schedules.
          </p>
        </div>

        <div className={styles.leftTestimonial}>
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

        <div className={styles.leftFooter}>
          <a href="#" className={styles.footerLink}>Terms</a>
          <a href="#" className={styles.footerLink}>Privacy Policy</a>
          <button onClick={handleLogout} className={styles.footerLink} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <LogOut size={12} /> Log Out
          </button>
        </div>
      </div>

      {/* Right panel: Wizard stepper */}
      <div className={styles.rightPanel}>
        <div className={styles.cardPanel}>
          {/* Progress Indicators */}
          <div className={styles.stepper}>
            {[1, 2].map((s) => (
              <div
                key={s}
                className={`${styles.stepDot} ${s === step ? styles.stepDotActive : styles.stepDotInactive}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div>
              <div className={styles.infoBox}>
                <Info size={18} className={styles.infoIcon} />
                <p>
                  Your display name and phone number will be shared with the event planners and team members you coordinate with.
                </p>
              </div>

              <h2 className={styles.question}>Introduce yourself</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="input-wrapper">
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

                <div className="input-wrapper">
                  <label className={styles.formLabel} htmlFor="phone">Phone Number (+234)</label>
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
                <Sparkles size={18} className={styles.infoIcon} style={{ color: 'var(--color-accent)' }} />
                <p>
                  planners search for coordinators based on specialty. Choosing a focus helps match you to the right role.
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

          {/* Stepper Navigation */}
          <div className={styles.navRow}>
            {step > 1 && (
              <button onClick={handleBack} className={styles.backBtn} disabled={loading}>
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className={styles.continueBtn}
              disabled={loading || (step === 1 && !name.trim())}
            >
              {loading ? (
                'Saving Details...'
              ) : step === 2 ? (
                'Complete Profile'
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Continue <ChevronRight size={16} />
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}
