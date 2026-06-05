import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import type { UserRole } from '@/types'
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
  },
  {
    image: corporateImg,
    quote: "Managing financials and tracking payments for corporate events used to be a nightmare. Now, it's fully automated.",
    author: "Chinedu",
    role: "Managing Director, Innovate Africa Events",
    stars: 5,
  },
  {
    image: traditionalImg,
    quote: "The vendor directory and chat interface saved us days of calls for our Abuja conference.",
    author: "Halima",
    role: "Lead Coordinator, Oasis Event Architects",
    stars: 5,
  },
]

const roles: { value: UserRole; label: string; desc: string }[] = [
  { value: 'planner', label: 'Event Planner', desc: 'Manage event setups, client portals, budgeting, and teams' },
  { value: 'coordinator', label: 'Coordinator', desc: 'Operational day-of coordination, assigning tasks, and timelines' },
]

export function RegisterPage() {
  const [step, setStep] = useState<'role' | 'form'>('role')
  const [role, setRole] = useState<UserRole>('planner')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const navigate = useNavigate()
  const showToast = useUIStore((s) => s.showToast)

  // Rotate slides every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, role, phone },
      },
    })

    if (error) {
      showToast({ type: 'error', title: 'Registration failed', body: error.message })
      setLoading(false)
      return
    }

    navigate('/verify-email')
    setLoading(false)
  }

  return (
    <div className={styles.container}>
      {/* Left Panel: Slider & Testimonials */}
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
            {/* Brand Branding */}
            <div className={styles.branding}>
              <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.brandLogoImage} />
            </div>

            {/* Testimonial Section */}
            <div className={styles.testimonialWrapper}>
              <div className={styles.testimonialCard}>
                <div className={styles.stars}>
                  {Array.from({ length: slides[currentSlide].stars }).map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className={styles.quoteText}>"{slides[currentSlide].quote}"</p>
                
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>
                    {slides[currentSlide].author.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.authorDetails}>
                    <span className={styles.authorName}>{slides[currentSlide].author}</span>
                    <span className={styles.authorRole}>{slides[currentSlide].role}</span>
                  </div>
                </div>
              </div>

              {/* Slider Dots */}
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

      {/* Right Panel: Registration Form */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          
          {step === 'role' ? (
            <>
              <div className={styles.formHeader}>
                <h1>Join EventGrid</h1>
                <p className={styles.formSubtitle}>
                  Choose your account type to get started, or{' '}
                  <Link to="/login" className={styles.formLink}>
                    Sign in
                  </Link>
                </p>
              </div>

              <div className={styles.roleSelector}>
                {roles.map((r) => (
                  <button
                    key={r.value}
                    className={`${styles.roleCard} ${role === r.value ? styles.roleCardActive : ''}`}
                    onClick={() => {
                      setRole(r.value)
                      setStep('form')
                    }}
                  >
                    <div className={styles.roleTitle}>{r.label}</div>
                    <div className={styles.roleDesc}>{r.desc}</div>
                  </button>
                ))}
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
                  Signing up as an <strong>{role === 'planner' ? 'Event Planner' : 'Coordinator'}</strong>.
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
                  <label className="input-label" htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    className={styles.inputField}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={loading}
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
