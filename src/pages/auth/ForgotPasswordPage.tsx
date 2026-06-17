import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Star, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { SEO } from '@/components/shared/SEO'
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const showToast = useUIStore((s) => s.showToast)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      showToast({ type: 'error', title: 'Failed to send reset email', body: error.message })
      return
    }

    setSent(true)
  }

  return (
    <div className={styles.container}>
      <SEO title="Forgot Password — NaliGrid" description="Reset your NaliGrid account password and regain access to your event management workspace." />
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
          <div className={styles.formHeader}>
            <h1>Reset your password</h1>
            <p className={styles.formSubtitle}>
              {sent
                ? 'Check your email for the reset link.'
                : 'Enter your email and we will send you a reset link.'}
            </p>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
              <div style={{
                width: 64, height: 64,
                backgroundColor: 'var(--color-accent-muted)',
                color: 'var(--color-accent)',
                borderRadius: 'var(--radius-full)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto var(--space-4)',
              }}>
                <Mail size={32} />
              </div>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 var(--space-4)' }}>
                We sent a password reset link to <strong>{email}</strong>.
                Click the link in the email to create a new password.
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                Did not get the email? Check your spam folder or{' '}
                <button type="button" className={styles.formLink} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', padding: 0 }} onClick={() => setSent(false)}>
                  try again
                </button>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading || !email.trim()}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 'var(--space-5)', gap: 'var(--space-2)' }}>
            <Link to="/login" className={styles.formLink} style={{ fontSize: 'var(--text-sm)', display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <ArrowLeft size={14} />
              Back to sign in
            </Link>
            <Link to="/" className={styles.backToLanding}>
              <ArrowLeft size={16} />
              Back to main site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
