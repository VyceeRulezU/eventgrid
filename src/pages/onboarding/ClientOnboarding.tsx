import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, LogOut, ArrowLeft } from 'lucide-react'
import { OnboardingTestimonials } from '@/components/onboarding/OnboardingTestimonials'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Onboarding.module.css'

const STEP_LABELS = ['Personal Info', 'You\'re All Set']

export function ClientOnboarding() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const setProfile = useAuthStore((s) => s.setProfile)
  const showToast = useUIStore((s) => s.showToast)
  const navigate = useNavigate()
  const TOTAL_STEPS = 2

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
        phone: phone || null,
        role: 'client',
      })
      .eq('id', user.id)

    if (error) {
      showToast({ type: 'error', title: 'Update failed', body: error.message })
      setLoading(false)
      return
    }

    await supabase.auth.updateUser({
      data: { role: 'client', onboarding_completed: true },
    })

    if (profile) {
      setProfile({ ...profile, role: 'client', display_name: name, phone: phone || null })
    }

    showToast({ type: 'success', title: 'Welcome to NaliGrid!' })
    navigate('/dashboard/client')
    setLoading(false)
  }

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      showToast({ type: 'error', title: 'Name is required' })
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
      <SEO title="Client Onboarding" description="Set up your client profile on NaliGrid." />
      {/* ── Left panel ── */}
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/ng-logo-wg.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
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
          <div className={styles.welcomeTag}>Client Setup</div>
          <h1 className={styles.welcomeTitle}>Welcome to NaliGrid</h1>
          <p className={styles.welcomeDesc}>
            Join thousands of clients finding the perfect event professionals. Set up your profile to start planning your dream event.
          </p>
        </div>

        <OnboardingTestimonials />

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
                <Sparkles size={16} className={styles.infoIcon} />
                <p style={{ margin: 0 }}>
                  Your name and contact will be shared with planners and vendors you request quotes from.
                </p>
              </div>

              <h2 className={styles.question}>Tell us about yourself</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label className={styles.formLabel} htmlFor="clientName">
                    Full name <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    id="clientName"
                    type="text"
                    className={styles.inputField}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className={styles.formLabel} htmlFor="clientPhone">
                    Phone number <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="clientPhone"
                    type="tel"
                    className={styles.inputField}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="080..."
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
                  You are all set! Start exploring top event professionals and bring your vision to life.
                </p>
              </div>

              <h2 className={styles.question}>You're ready to go!</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className={styles.welcomeFeatures}>
                  <div className={styles.welcomeFeature}>
                    <Sparkles size={20} />
                    <span>Request quotes from planners, vendors, and coordinators</span>
                  </div>
                  <div className={styles.welcomeFeature}>
                    <Sparkles size={20} />
                    <span>Create events and build your dream team</span>
                  </div>
                  <div className={styles.welcomeFeature}>
                    <Sparkles size={20} />
                    <span>Track progress and stay in the loop</span>
                  </div>
                </div>
              </div>

              <div className={styles.launchDisclaimer} style={{ marginTop: 'var(--space-4)' }}>
                <Sparkles size={14} className={styles.disclaimerIcon} />
                <p style={{ margin: 0 }}>
                  By completing setup, your profile will be visible to event professionals you connect with.
                </p>
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
            {loading ? 'Setting up…' : step === TOTAL_STEPS ? 'Get Started' : (
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
