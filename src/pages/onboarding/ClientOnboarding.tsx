import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, LogOut, ArrowLeft } from 'lucide-react'
import { OnboardingTestimonials } from '@/components/onboarding/OnboardingTestimonials'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Onboarding.module.css'

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

  return (
    <div className={styles.container}>
      <SEO title="Client Onboarding" description="Set up your client profile on NaliGrid." />
      <div className={styles.leftPanel}>
        <div className={styles.topBar}>
          <div className={styles.branding}>
            <Link to="/">
              <img src="/ng-logo-wg.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
            </Link>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>

        <div className={styles.stepsIndicator}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div key={i} className={`${styles.stepDot} ${i + 1 <= step ? styles.stepDotActive : ''}`} />
          ))}
        </div>

        <div className={styles.content}>
          {step === 1 && (
            <div className={styles.panelFadeIn}>
              <h2 className={styles.panelTitle}>Welcome! Tell us about yourself</h2>
              <p className={styles.panelSubtitle}>We'll help you find the right event professionals.</p>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Full name</label>
                <input className={styles.formInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Phone number (optional)</label>
                <input className={styles.formInput} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080..." />
              </div>
              <p className={styles.formHint}>Your name will be visible to planners and vendors you connect with.</p>
            </div>
          )}

          {step === 2 && (
            <div className={styles.panelFadeIn}>
              <h2 className={styles.panelTitle}>You're all set!</h2>
              <p className={styles.panelSubtitle}>
                As a client, you can request quotes from top event professionals, create events, and manage your team — all in one place.
              </p>
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
          )}
        </div>

        <div className={styles.navButtons}>
          {step > 1 && (
            <button className="btn btn-secondary" onClick={() => setStep((prev) => prev - 1)}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button className="btn btn-primary" onClick={handleNext} disabled={loading} style={{ marginLeft: 'auto' }}>
            {loading ? 'Setting up...' : step === TOTAL_STEPS ? 'Get Started' : 'Continue'} <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <OnboardingTestimonials />
      </div>
    </div>
  )
}
