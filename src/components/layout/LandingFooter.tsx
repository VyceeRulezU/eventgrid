import { Link } from 'react-router-dom'
import styles from './LandingFooter.module.css'

const PRODUCT_LINKS = [
  { label: 'Features', to: '/#features' },
  { label: 'Pricing', to: '/#pricing' },
  { label: 'Client Portal', to: '/portal' },
  { label: 'Live Board', to: '/register' },
]

const COMPANY_LINKS = [
  { label: 'About', to: '/' },
  { label: 'Contact', to: '/' },
  { label: 'Careers', to: '/' },
]

const RESOURCES_LINKS = [
  { label: 'Help Center', to: '/' },
  { label: 'Blog', to: '/' },
  { label: 'API Docs', to: '/' },
]

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link to="/" className={styles.brandLink}>
              NaliGrid
            </Link>
            <p className={styles.brandDesc}>
              The premium event management platform built for Nigerian professionals.
            </p>
            <div className={styles.social}>
              <a href="https://www.instagram.com/naligrid/" className={styles.socialLink} aria-label="Instagram">IG</a>
              <a href="https://www.tiktok.com/@naligrid" className={styles.socialLink} aria-label="TikTok">TT</a>
              <a href="https://facebook.com/naligrid" className={styles.socialLink} aria-label="Facebook">FB</a>
              <a href="https://twitter.com/naligrid" className={styles.socialLink} aria-label="Twitter">X</a>
              <a href="https://linkedin.com/company/naligrid" className={styles.socialLink} aria-label="LinkedIn">in</a>
            </div>
          </div>

          <div>
            <div className={styles.linkGroupTitle}>Product</div>
            <div className={styles.linkList}>
              {PRODUCT_LINKS.map((link) => (
                <Link key={link.label} to={link.to} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className={styles.linkGroupTitle}>Company</div>
            <div className={styles.linkList}>
              {COMPANY_LINKS.map((link) => (
                <Link key={link.label} to={link.to} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className={styles.linkGroupTitle}>Resources</div>
            <div className={styles.linkList}>
              {RESOURCES_LINKS.map((link) => (
                <Link key={link.label} to={link.to} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {year} NaliGrid. Built for Nigerian event professionals.
          </p>
          <div className={styles.legal}>
            <span className={styles.legalItem}>Privacy Policy</span>
            <span className={styles.legalItem}>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
