import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Star, Eye, EyeOff, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import { getPasswordStrength, strengthColors } from '@/lib/passwordStrength'
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

const passwordChecks = [
  { id: 'length', label: 'At least 6 characters', test: (p: string) => p.length >= 6 },
  { id: 'mixed', label: 'Uppercase & lowercase letters', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'number', label: 'At least one number', test: (p: string) => /\d/.test(p) },
  { id: 'special', label: 'At least one special character', test: (p: string) => /[^a-zA-Z0-9]/.test(p) },
]

export function ResetPasswordPage() {
  const showToast = useUIStore((s) => s.showToast)

  const [checking, setChecking] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setValidSession(true)
      } else {
        const params = new URLSearchParams(window.location.hash.replace('#', '?'))
        const type = params.get('type')
        const accessToken = params.get('access_token')
        if (type === 'recovery' && accessToken) {
          supabase.auth.getSession().then(({ data: sData }) => {
            setValidSession(!!sData.session)
            setChecking(false)
          })
        } else {
          setValidSession(false)
          setChecking(false)
        }
      }
      setChecking(false)
    })
  }, [])

  const pwStrength = getPasswordStrength(password)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      showToast({ type: 'error', title: 'Passwords do not match', body: 'Confirm your new password.' })
      return
    }
    if (pwStrength.score < 2) {
      showToast({ type: 'error', title: 'Weak password', body: 'Choose a stronger password.' })
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      showToast({ type: 'error', title: 'Failed to reset password', body: error.message })
      return
    }

    setDone(true)
    await supabase.auth.signOut()
  }

  return (
    <div className={styles.container}>
      <SEO title="Reset Password — NaliGrid" description="Create a new password for your NaliGrid account." />
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
        <div className={styles.formWrapper}>
          {checking ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-8) 0' }}>
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Verifying reset link...</div>
            </div>
          ) : done ? (
            <>
              <div className={styles.formHeader}>
                <h1>Password reset</h1>
                <p className={styles.formSubtitle}>Your password has been updated successfully.</p>
              </div>
              <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                <div style={{
                  width: 64, height: 64,
                  backgroundColor: 'var(--color-success-bg, var(--color-accent-muted))',
                  color: 'var(--color-accent)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}>
                  <Check size={32} />
                </div>
                <Link to="/login" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  Sign in with new password
                </Link>
              </div>
            </>
          ) : validSession ? (
            <>
              <div className={styles.formHeader}>
                <h1>Set new password</h1>
                <p className={styles.formSubtitle}>Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handleReset}>
                <div className="input-wrapper">
                  <label className="input-label" htmlFor="password">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className={styles.inputField}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      required
                      minLength={6}
                      style={{ paddingRight: '36px' }}
                      autoFocus
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      style={{
                        position: 'absolute', right: '8px', top: '50%',
                        transform: 'translateY(-50%)', background: 'none', border: 'none',
                        cursor: 'pointer', padding: '4px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', color: '#fff',
                        opacity: 0.6,
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {password && (
                  <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    {passwordChecks.map((check) => (
                      <div key={check.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', color: check.test(password) ? 'var(--color-success, #22c55e)' : 'var(--color-text-muted)' }}>
                        {check.test(password) ? <Check size={12} /> : <X size={12} />}
                        {check.label}
                      </div>
                    ))}
                  </div>
                )}

                {password && (
                  <div style={{ marginTop: 'var(--space-2)', height: 4, borderRadius: 2, background: 'var(--color-surface-3)', overflow: 'hidden' }}>
                    <div style={{ width: `${pwStrength.score * 25}%`, height: '100%', borderRadius: 2, background: strengthColors[pwStrength.level as keyof typeof strengthColors] || '#6B7280', transition: 'width 200ms ease' }} />
                  </div>
                )}

                <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                  <label className="input-label" htmlFor="confirm-password">Confirm New Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className={styles.inputField}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-error, #ef4444)', marginTop: 'var(--space-1)' }}>Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading || !password || password !== confirmPassword}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <Link to="/" className={styles.backToLanding}>
                <ArrowLeft size={16} />
                Back to main site
              </Link>
            </>
          ) : (
            <>
              <div className={styles.formHeader}>
                <h1>Invalid or expired link</h1>
                <p className={styles.formSubtitle}>This password reset link is no longer valid.</p>
              </div>
              <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
                <div style={{
                  width: 64, height: 64,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto var(--space-4)',
                }}>
                  <X size={32} />
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                  Request a new password reset link to continue.
                </p>
                <Link to="/forgot-password" className={styles.submitBtn} style={{ textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                  Request new link
                </Link>
              </div>
              <Link to="/" className={styles.backToLanding}>
                <ArrowLeft size={16} />
                Back to main site
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
