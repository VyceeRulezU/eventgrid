import { Link, useLocation } from 'react-router-dom'
import { Instagram, Twitter, Linkedin } from 'lucide-react'
import styles from './Footer.module.css'

const NAV_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/home#features', internal: true },
      { label: 'How It Works', href: '/home#how-it-works', internal: true },
      { label: 'For Planners', href: '/home#spotlight-a', internal: true },
      { label: 'For Coordinators', href: '/coordinators', internal: true },
      { label: 'For Vendors', href: '/vendors-landing', internal: true },
      { label: 'Pricing', href: '/pricing', internal: true },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Event Pipeline', href: '/features/pipeline', internal: true },
      { label: 'Live Board', href: '/features/live-board', internal: true },
      { label: 'Client Portal', href: '/features/client-portal', internal: true },
      { label: 'Vendor Tracker', href: '/features/vendor-tracker', internal: true },
      { label: 'Aftermath Reports', href: '/features/aftermath-reports', internal: true },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about', internal: true },
      { label: 'Blog', href: '/blog', internal: true },
      { label: 'Careers', href: '/careers', internal: true },
      { label: 'Press Kit', href: '/press', internal: true },
      { label: 'Contact', href: '/contact', internal: true },
    ],
  },
]

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Security', href: '/security' },
  { label: 'FAQ', href: '/faq' },
]

export default function Footer() {
  const location = useLocation()

  const handleLinkClick = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('/home#')) {
      const hash = href.substring(5) // Extract '#features' etc
      if (location.pathname === '/home') {
        e.preventDefault()
        const target = document.querySelector(hash)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }
  }

  return (
    <footer className={styles.footer} aria-label="Site footer">

      {/* ── Gold accent rule ── */}
      <div className={styles.accentRule} aria-hidden />

      {/* ── Nav + Tagline block ── */}
      <div className={styles.container}>
        <div className={styles.navBlock}>
          {/* Nav columns */}
          <div className={styles.navCols}>
            {NAV_COLS.map((col) => (
              <div key={col.title} className={styles.navCol}>
                <span className={styles.colTitle}>{col.title}</span>
                <ul className={styles.linksList}>
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.href}
                        onClick={(e) => handleLinkClick(e, link.href)}
                        className={styles.navLink}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Right: Built for Nigeria + socials */}
          <div className={styles.brandSide}>
            <p className={styles.builtFor}>
              Built for Nigeria.<br />
              <span className={styles.builtForMuted}>Ready for Africa.</span>
            </p>
            <div className={styles.socials}>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}>
                <Instagram size={17} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={styles.socialLink}>
                <Linkedin size={17} />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter (X)" className={styles.socialLink}>
                <Twitter size={17} />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Giant wordmark ── */}
      <div className={styles.container}>
        <div className={styles.wordmarkBlock}>
          <span className={styles.wordmark} aria-hidden>EventGrid</span>
        </div>
      </div>

      {/* ── Bottom bar — legal + city image ── */}
      <div className={styles.bottomBar}>
        <div className={styles.bottomBgWrap}>
          <img
            src="https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1800&q=75&auto=format&fit=crop&crop=bottom"
            alt=""
            className={styles.bottomBgImg}
            aria-hidden
            loading="lazy"
          />
          <div className={styles.bottomBgOverlay} />
        </div>
        <div className={styles.container}>
          <div className={styles.bottomContent}>
            <div className={styles.legalLinks}>
              {LEGAL_LINKS.map((link, i) => (
                <span key={link.label} className={styles.legalGroup}>
                  <Link to={link.href} className={styles.legalLink}>
                    {link.label}
                  </Link>
                  {i < LEGAL_LINKS.length - 1 && (
                    <span className={styles.legalDot} aria-hidden>·</span>
                  )}
                </span>
              ))}
            </div>
            <p className={styles.copyright}>
              © 2026 EventGrid by NaliTech Consults · Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </div>

    </footer>
  )
}
