import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import corporateImg from '@/assets/images/corporate_event_hall.png'
import styles from './PageHero.module.css'

interface Breadcrumb {
  label: string
  to?: string
}

interface PageHeroProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  backTo?: string
  backgroundImage?: string
}

export function PageHero({ icon: Icon, title, subtitle, breadcrumbs, actions, backTo, backgroundImage }: PageHeroProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.hero} style={{ '--hero-bg': `url(${backgroundImage || corporateImg})` } as React.CSSProperties}>
      <div className={styles.heroOverlay} />

      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className={styles.breadcrumbs}>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.label}>
              {i > 0 && <span className={styles.breadcrumbSeparator}>&gt;</span>}
              {crumb.to ? (
                <Link to={crumb.to} className={styles.breadcrumbLink}>{crumb.label}</Link>
              ) : (
                <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
              )}
            </span>
          ))}
        </div>
      )}

      <div className={styles.heroContent}>
        <div className={styles.iconTitleGroup}>
          <div className={styles.heroIcon}>
            <Icon size={24} />
          </div>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>{title}</h1>
            {subtitle && <p className={styles.heroSubtitle}>{subtitle}</p>}
          </div>
        </div>
        <div className={styles.heroActions}>
          {actions}
          {backTo && (
            <button type="button" className={styles.backBtn} onClick={() => navigate(backTo)} aria-label="Back">
              <ArrowLeft size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
