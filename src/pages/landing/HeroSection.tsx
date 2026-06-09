import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './HeroSection.module.css'

const SLIDES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80'
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isLoggedIn = !!user

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className={styles.hero} id="hero" aria-label="Hero">
      {/* Slideshow background with Ken Burns zoom */}
      <div className={styles.slideshow}>
        <AnimatePresence>
          <motion.div
            key={currentSlide}
            className={styles.slide}
            initial={{ opacity: 0, scale: 1 }}
            animate={{ opacity: 1, scale: 1.15 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 1.5, ease: 'easeInOut' },
              scale: { duration: 6, ease: 'easeOut' },
            }}
            style={{ backgroundImage: `url(${SLIDES[currentSlide]})` }}
          />
        </AnimatePresence>
      </div>

      {/* Dark overlay for text contrast */}
      <div className={styles.overlay} />

      {/* Grid container */}
      <div className={styles.container}>
        <div className={styles.heroLayout}>
          {/* Left Column: Headline and CTA */}
          <motion.div
            className={styles.leftCol}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h1 className={styles.title}>
              Software for<br />
              Event Pros
            </h1>
            <motion.div
              className={styles.ctaWrap}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
            >
              {isLoggedIn ? (
                <Link to={role === 'super_admin' ? '/admin' : `/dashboard/${role || 'planner'}`} className={styles.btnGold}>
                  <LayoutDashboard size={20} />
                  Continue to Dashboard
                </Link>
              ) : (
                <Link to="/register" className={styles.btnGold}>
                  Try It Free
                </Link>
              )}
            </motion.div>
          </motion.div>

          {/* Right Column: Tagline */}
          <motion.div
            className={styles.rightCol}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
          >
            <p className={styles.summary}>
              TRUSTED BY TOP PLANNERS TO<br />
              ORGANIZE, SIMPLIFY, AND GROW
            </p>
          </motion.div>
        </div>
      </div>

      {/* Animated scroll down indicator */}
      <motion.div
        className={styles.scrollIndicator}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2, ease: 'easeOut' }}
      >
        <span className={styles.scrollText}>Scroll to explore</span>
        <svg
          className={styles.bounceChevron}
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.div>
    </section>
  )
}
