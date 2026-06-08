import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Mail, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
import styles from './Auth.module.css'

import weddingImg from '@/assets/images/wedding_event_hall.png'
import corporateImg from '@/assets/images/corporate_event_hall.png'
import traditionalImg from '@/assets/images/traditional_event.png'

const slides = [
  {
    image: weddingImg,
    quote: "EventGrid has completely changed how we coordinate weddings in Lagos. Our clients love the live timeline tracker!",
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

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkMode, setMagicLinkMode] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (magicLinkMode) {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) {
        showToast({ type: 'error', title: 'Magic link failed', body: error.message })
        setLoading(false)
        return
      }
      showToast({ type: 'success', title: 'Magic link sent', body: 'Check your email for the login link.' })
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      showToast({ type: 'error', title: 'Login failed', body: error.message })
      setLoading(false)
      return
    }

    if (data.user) {
      setUser(data.user)
      const role = data.user.user_metadata?.role
      navigate(role ? `/dashboard/${role}` : '/')
    }

    setLoading(false)
  }

  const handleOAuth = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider })
      if (error) {
        showToast({ type: 'error', title: `${provider} sign in failed`, body: error.message })
      }
    } catch {
      showToast({ type: 'error', title: `${provider} sign in failed`, body: 'An unexpected error occurred.' })
    }
  }

  return (
    <div className={styles.container}>
      <SEO title="Sign In to EventGrid" description="Log in to your EventGrid account to manage your 9-phase event workflow, track financials in Naira, and stay synced with your vendors." />
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
                <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.brandLogoImage} />
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
          <div className={styles.formHeader}>
            <h1>Welcome back</h1>
            <p className={styles.formSubtitle}>
              New to EventGrid?{' '}
              <Link to="/register" className={styles.formLink}>
                Create an account
              </Link>
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-wrapper">
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

            {!magicLinkMode && (
              <div className="input-wrapper" style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                  <label className="input-label" htmlFor="password" style={{ margin: 0 }}>Password</label>
                </div>
                <input
                  id="password"
                  type="password"
                  className={styles.inputField}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required={!magicLinkMode}
                />
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={loading}
            >
              {loading ? 'Sending...' : magicLinkMode ? 'Send Magic Link' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginTop: 'var(--space-3)', width: '100%', fontSize: 'var(--text-xs)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-1)' }}
            onClick={() => setMagicLinkMode(!magicLinkMode)}
          >
            {magicLinkMode ? <Key size={14} /> : <Mail size={14} />}
            {magicLinkMode ? 'Sign in with password instead' : 'Send magic link instead'}
          </button>

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
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
              onClick={() => handleOAuth('apple')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/></svg>
              Apple
            </button>
          </div>

          <Link to="/" className={styles.backToLanding}>
            <ArrowLeft size={16} />
            Back to main site
          </Link>
        </div>
      </div>
    </div>
  )
}
