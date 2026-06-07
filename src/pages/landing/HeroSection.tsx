import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styles from './HeroSection.module.css'

const SLIDES = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80'
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className={styles.hero} id="hero" aria-label="Hero">
      {/* Slideshow background */}
      <div className={styles.slideshow}>
        {SLIDES.map((url, index) => (
          <div
            key={url}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            style={{ backgroundImage: `url(${url})` }}
          />
        ))}
      </div>

      {/* Dark overlay for text contrast */}
      <div className={styles.overlay} />

      {/* Grid container */}
      <div className={styles.container}>
        <div className={styles.heroLayout}>
          {/* Left Column: Headline and CTA under it */}
          <div className={styles.leftCol}>
            <h1 className={styles.title}>
              Software for<br />
              Event Pros
            </h1>
            <div className={styles.ctaWrap}>
              <Link to="/register" className={styles.btnGold}>
                Try It Free
              </Link>
            </div>
          </div>

          {/* Right Column: Tagline summary aligned right */}
          <div className={styles.rightCol}>
            <p className={styles.summary}>
              TRUSTED BY TOP PLANNERS TO<br />
              ORGANIZE, SIMPLIFY, AND GROW
            </p>
          </div>
        </div>
      </div>

      {/* Animated scroll down indicator */}
      <div className={styles.scrollIndicator}>
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
      </div>
    </section>
  )
}
