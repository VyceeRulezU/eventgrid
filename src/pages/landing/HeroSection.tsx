import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './HeroSection.module.css'

const EVENT_CARDS = [
  {
    id: 'wedding',
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&auto=format&fit=crop&q=80',
    line1: 'Wedding',
    line2: 'Galas',
  },
  {
    id: 'corporate',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    line1: 'Corporate',
    line2: 'Launches',
  },
  {
    id: 'birthday',
    image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&auto=format&fit=crop&q=80',
    line1: 'Birthday',
    line2: 'Bashes',
  },
]

function SparkleLeft() {
  return (
    <svg className={styles.sparkleLeft} viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="60" y1="10" x2="60" y2="60" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="60" y1="10" x2="40" y2="40" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="60" y1="10" x2="80" y2="40" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="60" y1="10" x2="30" y2="25" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="60" y1="10" x2="90" y2="25" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <circle cx="60" cy="10" r="3" fill="#c8900e" opacity="0.6"/>
      <line x1="30" y1="90" x2="30" y2="130" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="30" y1="90" x2="12" y2="115" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <line x1="30" y1="90" x2="48" y2="115" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <circle cx="30" cy="90" r="2.5" fill="#c8900e" opacity="0.5"/>
    </svg>
  )
}

function SparkleRight() {
  return (
    <svg className={styles.sparkleRight} viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="60" y1="10" x2="60" y2="60" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
      <line x1="60" y1="10" x2="80" y2="40" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="60" y1="10" x2="40" y2="40" stroke="#c8900e" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      <line x1="60" y1="10" x2="90" y2="25" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="60" y1="10" x2="30" y2="25" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <circle cx="60" cy="10" r="3" fill="#c8900e" opacity="0.6"/>
      <line x1="90" y1="90" x2="90" y2="130" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="90" y1="90" x2="108" y2="115" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <line x1="90" y1="90" x2="72" y2="115" stroke="#c8900e" strokeWidth="1.5" strokeLinecap="round" opacity="0.25"/>
      <circle cx="90" cy="90" r="2.5" fill="#c8900e" opacity="0.5"/>
    </svg>
  )
}

export default function HeroSection() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const isLoggedIn = !!user

  return (
    <section className={styles.hero} id="hero" aria-label="Hero">

      {/* ── Center text block ── */}
      <div className={styles.center}>
        <SparkleLeft />
        <SparkleRight />

        <h1 className={styles.headline}>
          Event Management at<br />
          Your Fingertips
        </h1>

        <p className={styles.sub}>
          The all-in-one platform for Nigerian planners, coordinators and vendors.<br />
          From first brief to aftermath — all in one place.
        </p>

        <div className={styles.ctaRow}>
          {isLoggedIn ? (
            <Link to={`/dashboard/${role || 'planner'}`} className={styles.btnPrimary} id="hero-dashboard-btn">
              Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <Link to="/register" className={styles.btnPrimary} id="hero-register-btn">
              Get Started <ArrowRight size={16} />
            </Link>
          )}
        </div>
      </div>

      {/* ── Event type cards ── */}
      <div className={styles.cardsRow}>
        {EVENT_CARDS.map((card) => (
          <div key={card.id} className={styles.card}>
            <img src={card.image} alt={`${card.line1} ${card.line2}`} className={styles.cardImg} loading="eager" />
            <div className={styles.cardOverlay} />
            <div className={styles.cardText}>
              <span className={styles.cardLine1}>{card.line1}</span>
              <span className={styles.cardLine2}>{card.line2}</span>
            </div>
          </div>
        ))}
      </div>

    </section>
  )
}
