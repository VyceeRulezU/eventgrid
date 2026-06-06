import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { label: 'Features',        href: '#features' },
  { label: 'How It Works',    href: '#how-it-works' },
  { label: 'Pricing',         href: '#pricing' },
  { label: 'For Coordinators', href: '#coordinators' },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const menuRef                      = useRef<HTMLDivElement>(null)

  const user    = useAuthStore((s) => s.user)
  const role    = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)

  const isLoggedIn  = !!user
  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Close menu on outside click ── */
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const handleNavClick = (href: string) => {
    setMenuOpen(false)
    const target = document.querySelector(href)
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      ref={menuRef}
    >
      <div className={styles.container}>
        {/* Logo */}
        <Link to="/" className={styles.logo} aria-label="EventGrid home">
          <svg
            className={styles.logoMark}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <rect x="2" y="2" width="12" height="12" rx="3" fill="var(--color-accent)" opacity="0.9" />
            <rect x="18" y="2" width="12" height="12" rx="3" fill="var(--color-accent)" opacity="0.6" />
            <rect x="2" y="18" width="12" height="12" rx="3" fill="var(--color-accent)" opacity="0.6" />
            <rect x="18" y="18" width="12" height="12" rx="3" fill="var(--color-accent)" opacity="0.9" />
          </svg>
          <span className={styles.wordmark}>EventGrid</span>
        </Link>

        {/* Desktop nav links */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <button
              key={link.href}
              className={styles.navLink}
              onClick={() => handleNavClick(link.href)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA buttons */}
        <div className={styles.desktopCta}>
          {isLoggedIn ? (
            <>
              <span className={styles.greeting}>
                {displayName ? `Hi, ${displayName.split(' ')[0]}` : ''}
              </span>
              <Link
                to={`/dashboard/${role || 'planner'}`}
                className="btn btn-primary"
              >
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" id="navbar-login-btn">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary" id="navbar-get-started-btn">
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Hamburger (mobile) */}
        <button
          className={styles.hamburger}
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          id="navbar-hamburger-btn"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu} role="dialog" aria-label="Mobile navigation">
          <nav className={styles.mobileNav} aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                className={styles.mobileNavLink}
                onClick={() => handleNavClick(link.href)}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className={styles.mobileCta}>
            {isLoggedIn ? (
              <Link
                to={`/dashboard/${role || 'planner'}`}
                className="btn btn-primary"
                onClick={() => setMenuOpen(false)}
                style={{ width: '100%' }}
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-ghost"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%' }}
                  id="mobile-login-btn"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="btn btn-primary"
                  onClick={() => setMenuOpen(false)}
                  style={{ width: '100%' }}
                  id="mobile-get-started-btn"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
