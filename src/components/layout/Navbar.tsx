import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
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
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)
  const isLoggedIn = !!user
  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')

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

  /* ── Prevent body scrolling when mobile menu is active ── */
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
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
        <Link to="/home" className={styles.logo} aria-label="EventGrid home">
          <img src="/EventGrid-logo-white.svg" alt="EventGrid Logo" className={styles.logoImg} />
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
            <Link to={`/dashboard/${role || 'planner'}`} className={styles.userLink} id="navbar-user-link">
              <span className={styles.navAvatar}>{avatarLetter}</span>
              <span className={styles.navUserName}>{displayName}</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost" id="navbar-login-btn">
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary" id="navbar-get-started-btn">
                Try It Free
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
                className={styles.userLink}
                onClick={() => setMenuOpen(false)}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                <span className={styles.navAvatar}>{avatarLetter}</span>
                <span className={styles.navUserName}>{displayName}</span>
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
                  Try It Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
