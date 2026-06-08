import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Star } from 'lucide-react'
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

export function VerifyEmailPage() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className={styles.container}>
      <SEO title="Verify Your Email" description="Please verify your email address to activate your EventGrid account and start managing your event workflows." />
      
      {/* Left Panel: Testimonial Slideshow */}
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

      {/* Right Panel: Verify Content */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>
          <div style={{
            width: 64,
            height: 64,
            backgroundColor: 'var(--color-accent-muted)',
            color: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 'var(--space-6)',
          }}>
            <Mail size={32} />
          </div>

          <div className={styles.formHeader}>
            <h1 style={{ fontSize: 'var(--text-title-lg)', fontWeight: 'var(--weight-extrabold)', marginBottom: 'var(--space-2)' }}>Check your email</h1>
            <p className={styles.formSubtitle}>
              We sent a verification link to your email. Click the link in the message to activate your account.
            </p>
          </div>

          <div style={{ marginTop: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              Didn't get the email? Check your spam folder or try signing in to request a new verification code.
            </p>

            <Link to="/login" className={styles.submitBtn} style={{ textDecoration: 'none', textAlign: 'center' }}>
              Sign In to EventGrid
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

