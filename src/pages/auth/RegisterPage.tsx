import { useState, useEffect } from 'react'
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Star, Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import type { UserRole } from '@/types'
import { getPasswordStrength, strengthColors } from '@/lib/passwordStrength'
import { SEO } from '@/components/shared/SEO'
import { useCaptchaToken, CaptchaField, hasCaptcha } from '@/lib/captcha'
import styles from './Auth.module.css'

import weddingImg from '@/assets/images/wedding_event_hall.png'
import corporateImg from '@/assets/images/corporate_event_hall.png'
import traditionalImg from '@/assets/images/traditional_event.png'

const slides = [
  {
    image: weddingImg,
    quote: "NaliGrid has completely changed how we coordinate weddings in Lagos. Our clients love the live timeline tracker!",
    author: "Tolu & Chioma",
    role: "Founders, Premium Nuptials",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face",
  },
  {
    image: corporateImg,
    quote: "Managing financials and tracking payments for corporate events used to be a nightmare. Now, it's fully automated.",
    author: "Chinedu",
    role: "Managing Director, Innovate Africa Events",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
  },
  {
    image: traditionalImg,
    quote: "The vendor directory and chat interface saved us days of calls for our Abuja conference.",
    author: "Halima",
    role: "Lead Coordinator, Oasis Event Architects",
    stars: 5,
    avatar: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=100&h=100&fit=crop&crop=face",
  },
]

const roles: { value: UserRole; label: string; desc: string; image: string }[] = [
  { value: 'planner', label: 'Event Planner', desc: 'Manage event setups, client portals, budgeting, and teams', image: weddingImg },
  { value: 'coordinator', label: 'Coordinator', desc: 'Operational day-of coordination, assigning tasks, and timelines', image: traditionalImg },
  { value: 'client', label: 'Client / Guest', desc: 'View your invited events and browse the vendor directory', image: corporateImg },
]

const passwordChecks = [
  { id: 'length', label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { id: 'mixed', label: 'Uppercase & lowercase letters', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'At least one special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

export function RegisterPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const inviteRole = searchParams.get('role')
  const isSuperAdminInvite = inviteRole === 'super_admin'

  const adminRoles = ['super_admin', 'monitor', 'admin_support']

  if (inviteRole && adminRoles.includes(inviteRole)) {
    return <Navigate to={`/accept-admin-invite?role=${inviteRole}`} replace />
  }

  const [step, setStep] = useState<'role' | 'form'>(isSuperAdminInvite ? 'form' : 'role')
  const [role, setRole] = useState<UserRole>('planner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { token: captchaTokenValue, setToken: setCaptchaToken, getToken: getCaptchaToken } = useCaptchaToken()
  const [currentSlide, setCurrentSlide] = useState(0)

  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const showModal = useUIStore((s) => s.showModal)
  const dismissModal = useUIStore((s) => s.dismissModal)

  async function authRequestWithTimeout<T>(promise: Promise<T>, timeoutMs = 15000) {
    let timeoutId: number | null = null
    const timeout = new Promise<never>((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error('Authentication request timed out. Check your network and Supabase configuration.'))
      }, timeoutMs)
    })

    try {
      return await Promise.race([promise, timeout]) as T
    } finally {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId)
      }
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      if (existing) {
        showModal({
          variant: 'warning',
          title: 'Account already exists',
          message: 'An account with this email already exists. Please log in instead.',
          actions: [
            {
              label: 'Login',
              onClick: () => {
                dismissModal()
                navigate('/login')
              },
            },
            {
              label: 'Cancel',
              variant: 'secondary',
              onClick: () => dismissModal(),
            },
          ],
        })
        return
      }

      const metadata: Record<string, any> = { display_name: name, role, phone }
      if (isSuperAdminInvite) {
        metadata.is_super_admin = true
      }

      const captchaToken = getCaptchaToken()
      const { error } = await authRequestWithTimeout(supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: import.meta.env.VITE_APP_URL,
          ...(captchaToken && { captchaToken }),
        },
      }))

      if (error) throw error

      if (role === 'client') {
        navigate('/verify-email')
      } else {
        navigate('/verify-email')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to register. Please try again.'
      showToast({ type: 'error', title: 'Registration failed', body: message })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) {
        showToast({ type: 'error', title: `${provider} sign up failed`, body: error.message })
      }
    } catch {
      showToast({ type: 'error', title: `${provider} sign up failed`, body: 'An unexpected error occurred.' })
    }
  }

  const pwStrength = getPasswordStrength(password)

  return (
    <div className={styles.container}>
      <SEO title="Create Your NaliGrid Account" description="Join NaliGrid to manage event setups, timelines, budget tracking, teams, and vendors as an event planner or coordinator." />
      <div className={styles.leftPanel}>
        <div className={styles.floatingCard}>
          <div className={styles.sliderContainer}>
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`${styles.slide} ${idx === currentSlide ? styles.slideActive : ''}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              />
            ))}
          </div>
          <div className={styles.overlay} />

          <div className={styles.leftContent}>
            <div className={styles.branding}>
              <Link to="/">
                <img src="/EventGrid-logo-white.svg" alt="NaliGrid Logo" className={styles.brandLogoImage} />
              </Link>
            </div>

            <div className={styles.testimonialWrapper}>
              <div className={styles.testimonialCard}>
                <div className={styles.stars}>
                  {Array.from({ length: slides[currentSlide].stars }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className={styles.quoteText}>"{slides[currentSlide].quote}"</p>
                
                <div className={styles.authorInfo}>
                  {slides[currentSlide].avatar ? (
                    <img className={styles.authorAvatar} src={slides[currentSlide].avatar} alt={slides[currentSlide].author} />
                  ) : (
                    <div className={styles.authorAvatar}>
                      {slides[currentSlide].author.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.authorDetails}>
                    <span className={styles.authorName}>{slides[currentSlide].author}</span>
                    <span className={styles.authorRole}>{slides[currentSlide].role}</span>
                  </div>
                </div>
              </div>

              <div className={styles.sliderDots}>
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`${styles.dot} ${idx === currentSlide ? styles.dotActive : ''}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.rightPanel}>
        <div className={`${styles.formWrapper} ${step === 'role' ? styles.formWrapperRole : ''}`}>
          
          {step === 'role' ? (
            <>
              <div className={styles.formHeader}>
                <h1>Join NaliGrid</h1>
                <p className={styles.formSubtitle}>
                  Choose your account type to get started, or{' '}
                  <Link to="/login" className={styles.formLink}>
                    Sign in
                  </Link>
                </p>
              </div>

              <div className={styles.roleSelectorRow}>
                {roles.map((r) => (
                  <button
                    key={r.value}
                    className={`${styles.roleCardPicture} ${role === r.value ? styles.roleCardPictureActive : ''}`}
                    onClick={() => {
                      setRole(r.value)
                      setStep('form')
                    }}
                    style={{ backgroundImage: `url(${r.image})` }}
                  >
                    <div className={styles.roleCardPictureOverlay} />
                    <div className={styles.roleCardPictureContent}>
                      <div className={styles.roleCardPictureTitle}>{r.label}</div>
                      <div className={styles.roleCardPictureDesc}>{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                  onClick={() => handleOAuth('google')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Google
                </button>
              </div>

              <Link to="/" className={styles.backToLanding}>
                <ArrowLeft size={16} />
                Back to main site
              </Link>
            </>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1>Create Account</h1>
                <p className={styles.formSubtitle}>
                  Signing up as <strong>{isSuperAdminInvite ? 'Super Admin' : role === 'planner' ? 'Event Planner' : role === 'coordinator' ? 'Coordinator' : 'Client / Guest'}</strong>.
                </p>
              </div>

              <form onSubmit={handleRegister}>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="name">Full Name</label>
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

                <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="input-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    className={styles.inputField}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="input-label" htmlFor="phone">Phone Number (+234)</label>
                  <input
                    id="phone"
                    type="tel"
                    className={styles.inputField}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                  />
                </div>

                <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="input-label" htmlFor="password" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={styles.inputField}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      minLength={6}
                      required
                      style={{ paddingRight: '36px', borderColor: password ? strengthColors[pwStrength.level] : undefined }}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        opacity: 0.6,
                        transition: 'opacity var(--transition-fast)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {password && (
                    <div style={{ marginTop: 'var(--space-2)' }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-2)' }}>
                        {(['weak', 'fair', 'strong', 'very-strong'] as const).map((level) => (
                          <div
                            key={level}
                            style={{
                              flex: 1, height: 3, borderRadius: 2,
                              background: pwStrength.score >= 
                                (level === 'weak' ? 1 : level === 'fair' ? 25 : level === 'strong' ? 50 : 75)
                                ? strengthColors[level] : 'var(--color-border)',
                              transition: 'background 0.2s',
                            }}
                          />
                        ))}
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: strengthColors[pwStrength.level], fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                        {pwStrength.label}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {passwordChecks.map((check) => {
                          const passed = check.test(password)
                          return (
                            <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)', fontSize: 11, color: passed ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                              {passed ? <Check size={10} /> : <X size={10} />}
                              {check.label}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <CaptchaField onToken={setCaptchaToken} />
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || (hasCaptcha && !captchaTokenValue) || pwStrength.score < 15}
                  style={{ opacity: pwStrength.score < 15 && password ? 0.5 : 1 }}
                >
                  {loading ? 'Creating Account...' : 'Register Now'}
                </button>
              </form>

              <button
                className="btn btn-ghost"
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
                onClick={() => setStep('role')}
              >
                Change account type
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
