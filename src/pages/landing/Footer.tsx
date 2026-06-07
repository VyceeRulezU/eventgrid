import { Link } from 'react-router-dom'
import { Instagram, Twitter, Linkedin, ArrowUpRight } from 'lucide-react'
import styles from './Footer.module.css'

const NAV_COLS = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features', internal: false },
      { label: 'How It Works', href: '#how-it-works', internal: false },
      { label: 'For Planners', href: '#spotlight-a', internal: false },
      { label: 'For Coordinators', href: '#spotlight-b', internal: false },
      { label: 'For Vendors', href: '#roles', internal: false },
      { label: 'Pricing', href: '#pricing', internal: false },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Event Pipeline', href: '#features', internal: false },
      { label: 'Live Board', href: '#spotlight-b', internal: false },
      { label: 'Client Portal', href: '#spotlight-c', internal: false },
      { label: 'Vendor Tracker', href: '#features', internal: false },
      { label: 'Aftermath Reports', href: '#spotlight-d', internal: false },
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
  const scrollTo = (e: React.MouseEvent, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <footer className={styles.footer} aria-label="Site footer">

      {/* ── Gold accent rule ── */}
      <div className={styles.accentRule} aria-hidden />

      {/* ── CTA banner ── */}
      <div className={styles.ctaBanner}>
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaBannerText}>
            <p className={styles.ctaBannerEyebrow}>Ready to run better events?</p>
            <h2 className={styles.ctaBannerHeadline}>
              The platform built for<br />Nigerian event professionals.
            </h2>
          </div>
          <div className={styles.ctaBannerActions}>
            <Link to="/register" className={styles.ctaPrimary}>
              Get started free
              <ArrowUpRight size={16} />
            </Link>
            <a href="mailto:hello@eventgrid.ng" className={styles.ctaSecondary}>
              hello@eventgrid.ng
            </a>
          </div>
        </div>
      </div>

      {/* ── Nav + Tagline block ── */}
      <div className={styles.navBlock}>
        {/* Nav columns */}
        <div className={styles.navCols}>
          {NAV_COLS.map((col) => (
            <div key={col.title} className={styles.navCol}>
              <span className={styles.colTitle}>{col.title}</span>
              <ul className={styles.linksList}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.internal ? (
                      <Link to={link.href} className={styles.navLink}>
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        onClick={(e) => scrollTo(e, link.href)}
                        className={styles.navLink}
                      >
                        {link.label}
                      </a>
                    )}
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

      {/* ── Giant wordmark ── */}
      <div className={styles.wordmarkBlock}>
        <span className={styles.wordmark} aria-hidden>EventGrid</span>
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

    </footer>
  )
}
