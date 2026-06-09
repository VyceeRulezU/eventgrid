import type { LucideIcon } from 'lucide-react'
import traditionalEventImg from '@/assets/images/traditional_event.png'
import styles from './LandingPageHero.module.css'

interface Breadcrumb {
  label: string
  to?: string
}

interface LandingPageHeroProps {
  title: string
  subtitle: string
  eyebrow?: string
  bgImage?: string
  icon?: LucideIcon
  breadcrumbs?: Breadcrumb[]
}

export function LandingPageHero({ title, subtitle, eyebrow, bgImage, icon: Icon, breadcrumbs }: LandingPageHeroProps) {
  const imageUrl = bgImage || traditionalEventImg

  return (
    <section className={styles.heroSection} aria-label={title}>
      <div className={styles.bgWrapper} aria-hidden>
        <img src={imageUrl} alt="" className={styles.bgImage} />
        <div className={styles.overlayGradient} />
      </div>

      <div className={styles.container}>
        <div className={styles.heroContent}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className={styles.breadcrumbs}>
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.label}>
                  {i > 0 && <span className={styles.breadcrumbSeparator}>/</span>}
                  {crumb.to ? (
                    <a href={crumb.to} className={styles.breadcrumbLink}>{crumb.label}</a>
                  ) : (
                    <span className={styles.breadcrumbCurrent}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          <div className={styles.textBlock}>
            {Icon && (
              <div className={styles.iconBox}>
                <Icon size={20} />
              </div>
            )}
            {eyebrow && (
              <div className={styles.eyebrowWrapper}>
                <span className={styles.eyebrow}>{eyebrow}</span>
              </div>
            )}
            <h1 className={styles.title}>{title}</h1>
            <p className={styles.subtitle}>{subtitle}</p>
          </div>
        </div>
      </div>

      <div className={styles.accentRule} aria-hidden />
    </section>
  )
}
