import { Link } from 'react-router-dom'
import { Zap, ArrowRight, Play, ChevronDown, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './HeroSection.module.css'

const STATIONS = [
  { color: 'green',  name: 'Registration',  status: 'Ready',          icon: '✓' },
  { color: 'green',  name: 'Catering',       status: 'Confirmed',      icon: '✓' },
  { color: 'yellow', name: 'Decor',          status: '80% Complete',   icon: '↻' },
  { color: 'red',    name: 'Photography',    status: 'Delayed 15min',  icon: '!' },
  { color: 'green',  name: 'AV / Sound',     status: 'Functional',     icon: '✓' },
  { color: 'yellow', name: 'Ushers',         status: 'In Transit',     icon: '↻' },
] as const

const PROOF_ITEMS = [
  'No credit card required',
  'First event free',
  'Setup in 5 minutes',
]

export default function HeroSection() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isLoggedIn = !!user

  return (
    <section className={styles.hero} id="hero" aria-label="Hero">
      {/* Dot grid overlay */}
      <div className={styles.dotGrid} aria-hidden="true" />

      <div className={styles.container}>
        <div className={styles.layout}>

          {/* ── Left: Text column ── */}
          <div className={styles.textCol}>
            {/* Badge */}
            <div className={styles.badge} aria-label="Built for Nigerian Event Professionals">
              <Zap size={12} aria-hidden="true" />
              Built for Nigerian Event Professionals
            </div>

            {/* Headline */}
            <h1 className={styles.headline}>
              Run Every Event.<br />
              <span className={styles.accentText}>Coordinate Every Detail.</span>
            </h1>

            {/* Subheadline */}
            <p className={styles.sub}>
              Replace WhatsApp threads, Excel sheets, and last-minute
              chaos with one platform — from first inquiry to aftermath review.
            </p>

            {/* CTA buttons */}
            <div className={styles.ctaRow}>
              {isLoggedIn ? (
                <Link
                  to={`/dashboard/${role || 'planner'}`}
                  className={`btn btn-primary btn-lg ${styles.ctaPrimary}`}
                  id="hero-dashboard-btn"
                >
                  Go to Dashboard
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className={`btn btn-primary btn-lg ${styles.ctaPrimary}`}
                    id="hero-create-event-btn"
                  >
                    Create Your First Event
                    <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                  <button
                    className={`btn btn-secondary btn-lg ${styles.ctaSecondary}`}
                    onClick={() => {
                      document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    id="hero-see-how-btn"
                  >
                    <Play size={18} className={styles.playIcon} aria-hidden="true" />
                    See How It Works
                  </button>
                </>
              )}
            </div>

            {/* Social proof */}
            <ul className={styles.proofList} aria-label="Key benefits">
              {PROOF_ITEMS.map((item) => (
                <li key={item} className={styles.proofItem}>
                  <CheckCircle2 size={14} className={styles.checkIcon} aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: Visual / mock dashboard card ── */}
          <div className={styles.visualCol} aria-hidden="true">
            {/* Floating stat chips */}
            <div className={`${styles.chip} ${styles.chipTopRight}`}>
              9 Phases Tracked
            </div>
            <div className={`${styles.chip} ${styles.chipBottomLeft}`}>
              ₦2.4M Budget Managed
            </div>

            {/* Mock card */}
            <div className={styles.mockCard}>
              {/* Card header */}
              <div className={styles.mockHeader}>
                <div className={styles.liveRow}>
                  <span className={styles.liveDot} />
                  <span className={styles.liveLabel}>Live Event Board</span>
                  <span className={styles.liveBadge}>LIVE</span>
                </div>
                <div className={styles.eventName}>Eko Wedding 2025</div>
                <div className={styles.eventMeta}>Event Day • 14 stations active</div>
              </div>

              {/* Station rows */}
              <div className={styles.stationList}>
                {STATIONS.map((station) => (
                  <div key={station.name} className={styles.stationRow}>
                    <span className={`${styles.statusDot} ${styles[`dot${station.color.charAt(0).toUpperCase() + station.color.slice(1)}`]}`} />
                    <span className={styles.stationName}>{station.name}</span>
                    <span className={styles.stationStatus}>{station.status}</span>
                    <span className={`${styles.stationIcon} ${styles[`icon${station.color.charAt(0).toUpperCase() + station.color.slice(1)}`]}`}>
                      {station.icon}
                    </span>
                  </div>
                ))}
              </div>

              {/* Card footer */}
              <div className={styles.mockFooter}>
                <span className={styles.issuesBadge}>⚠ 2 issues flagged</span>
                <span className={styles.guestCount}>342 / 500 guests arrived</span>
              </div>

              {/* Bottom fade mask */}
              <div className={styles.fadeMask} />
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className={styles.scrollIndicator} aria-hidden="true">
        <span className={styles.scrollText}>Scroll to explore</span>
        <ChevronDown size={18} className={styles.scrollChevron} />
      </div>
    </section>
  )
}
