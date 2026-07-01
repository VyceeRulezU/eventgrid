import { Link, useLocation } from 'react-router-dom'

import styles from './Footer.module.css'

function TikTokIcon({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" fill="currentColor" />
    </svg>
  )
}

const NAV_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '/home#features', internal: true },
      { label: 'How It Works', href: '/home#how-it-works', internal: true },
      { label: 'For Planners', href: '/planners', internal: true },
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
      { label: 'FAQ', href: '/faq', internal: true },
      { label: 'Contact', href: '/contact', internal: true },
    ],
  },
]

const LEGAL_LINKS = [
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Cookie Policy', href: '/cookies' },
  { label: 'Data Deletion', href: '/data-deletion' },
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
              <a href="https://www.instagram.com/naligrid/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialLink}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
              </a>
              <a href="https://www.tiktok.com/@naligrid" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={styles.socialLink}>
                <TikTokIcon size={17} />
              </a>
              <a href="https://facebook.com/naligrid" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className={styles.socialLink}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="https://twitter.com/naligrid" target="_blank" rel="noopener noreferrer" aria-label="Twitter (X)" className={styles.socialLink}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46L20 4"/></svg>
              </a>
              <a href="https://linkedin.com/company/naligrid" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className={styles.socialLink}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Giant wordmark ── */}
      <div className={styles.wordmarkBlock}>
        <span className={styles.wordmark} aria-hidden>NaliGrid</span>
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
              © 2026 NaliGrid by NaliTech Consults Nig. Ltd. · Nigeria 🇳🇬
            </p>
          </div>
        </div>
      </div>

    </footer>
  )
}
