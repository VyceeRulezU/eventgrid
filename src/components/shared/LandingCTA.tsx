import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import styles from './LandingCTA.module.css'

interface LandingCTAProps {
  title?: string
  description?: string
  eyebrow?: string
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
  secondaryOnClick?: () => void
}

export function LandingCTA({
  title = 'The platform built for\nNigerian event professionals.',
  description = 'Get started in 30 seconds. Create your custom workspace and run flawless events.',
  eyebrow = 'Ready to run better events?',
  primaryText = 'Get started free',
  primaryHref = '/register',
  secondaryText = 'hello@naligrid.com',
  secondaryHref = 'mailto:hello@naligrid.com',
  secondaryOnClick
}: LandingCTAProps) {
  const isMailto = !secondaryOnClick && secondaryHref.startsWith('mailto:')

  const renderSecondary = () => {
    if (secondaryOnClick) {
      return (
        <a href={secondaryHref} onClick={(e) => { e.preventDefault(); secondaryOnClick() }} className={styles.secondaryBtn} id="cta-secondary-btn">
          {secondaryText}
        </a>
      )
    }
    if (isMailto) {
      return (
        <a href={secondaryHref} className={styles.secondaryBtn} id="cta-secondary-btn">
          {secondaryText}
        </a>
      )
    }
    return (
      <Link to={secondaryHref} className={styles.secondaryBtn} id="cta-secondary-btn">
        {secondaryText}
      </Link>
    )
  }

  return (
    <section className={styles.section} aria-label="Call to action">
      <div className={styles.noise} aria-hidden />

      <div className={styles.bgWrap} aria-hidden>
        <img
          src="https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1800&q=75&auto=format&fit=crop&crop=center"
          alt=""
          className={styles.bgImage}
          loading="lazy"
        />
        <div className={styles.bgOverlay} />
      </div>

      <div className={styles.accentRule} aria-hidden />

      <div className={styles.content}>
        <div className={styles.textBlock}>
          {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
          <h2 className={styles.headline}>{title}</h2>
          {description && <p className={styles.subtext}>{description}</p>}
        </div>

        <div className={styles.actions}>
          <Link to={primaryHref} className={styles.primaryBtn} id="cta-primary-btn">
            {primaryText}
            <ArrowUpRight size={18} />
          </Link>
          {renderSecondary()}
        </div>
      </div>
    </section>
  )
}
