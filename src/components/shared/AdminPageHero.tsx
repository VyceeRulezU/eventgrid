import type { LucideIcon } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import adminImg from '@/assets/images/wedding_event_hall.png'
import styles from './AdminPageHero.module.css'

interface Breadcrumb {
  label: string
  to?: string
}

interface AdminPageHeroProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  breadcrumbs?: Breadcrumb[]
  actions?: React.ReactNode
  backTo?: string
  backgroundImage?: string
}

export function AdminPageHero({ icon: Icon, title, subtitle, breadcrumbs, actions, backTo, backgroundImage }: AdminPageHeroProps) {
  const navigate = useNavigate()

  return (
    <div className={styles.adminHero} style={{ '--admin-hero-bg': `url(${backgroundImage || adminImg})` } as React.CSSProperties}>
      <div className={styles.adminHeroOverlay} />

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

      <div className={styles.adminHeroContent}>
        <div className={styles.adminHeroIcon}>
          <Icon size={24} />
        </div>
        <div className={styles.adminHeroText}>
          <h1 className={styles.adminHeroTitle}>{title}</h1>
          {subtitle && <p className={styles.adminHeroSubtitle}>{subtitle}</p>}
        </div>
        <div className={styles.adminHeroActions}>
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
