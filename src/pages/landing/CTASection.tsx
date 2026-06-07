import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import styles from './CTASection.module.css'

export default function CTASection() {
  return (
    <section className={styles.section} id="cta-section" aria-label="Get started with EventGrid">
      {/* Noise overlay */}
      <div className={styles.noise} aria-hidden />

      {/* Background event image */}
      <div className={styles.bgWrap} aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1800&q=75&auto=format&fit=crop&crop=center"
          alt=""
          className={styles.bgImage}
          loading="lazy"
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* Gold rule at top */}
      <div className={styles.accentRule} aria-hidden />

      {/* Content */}
      <div className={styles.content}>
        {/* Left — headline */}
        <div className={styles.textBlock}>
          <span className={styles.eyebrow}>Start today. Pay per event.</span>
          <h2 className={styles.headline}>
            No more chaos.<br />
            <span className={styles.goldLine}>Just coordinated events.</span>
          </h2>
          <p className={styles.subtext}>
            Works for planners, coordinators, and their entire team.<br />
            First activation takes 5 minutes. Nigerian Naira pricing.
          </p>

        </div>

        {/* Right — actions */}
        <div className={styles.actions}>
          <Link to="/register" className={styles.primaryBtn} id="cta-primary-btn">
            Create your first event
            <ArrowUpRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => {
              e.preventDefault()
              document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className={styles.secondaryBtn}
            id="cta-secondary-btn"
          >
            See how it works
          </a>
          <p className={styles.contactLine}>
            Questions?{' '}
            <a href="mailto:hello@eventgrid.ng" className={styles.contactLink}>
              hello@eventgrid.ng
            </a>
          </p>
        </div>
      </div>

    </section>
  )
}
