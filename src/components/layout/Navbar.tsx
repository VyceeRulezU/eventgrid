import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './Navbar.module.css'

interface NavLinkItem {
  label: string
  href: string
  isHash: boolean
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'Features',         href: '#features', isHash: true },
  { label: 'How It Works',     href: '#how-it-works', isHash: true },
  { label: 'Pricing',          href: '/pricing', isHash: false },
  { label: 'For Coordinators',  href: '/coordinators', isHash: false },
]

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false)
  const [menuOpen, setMenuOpen]     = useState(false)
  const menuRef                      = useRef<HTMLDivElement>(null)
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)
  const location = useLocation()
  const navigate = useNavigate()
  const isLoggedIn = !!user
  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  /* ── Scroll detection ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  /* ── Hash routing smooth scroller ── */
  useEffect(() => {
    if (location.pathname === '/home' && location.hash) {
      const target = document.querySelector(location.hash)
      if (target) {
        const timer = setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth' })
        }, 100)
        return () => clearTimeout(timer)
      }
    }
  }, [location])

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

  const handleNavClick = (link: NavLinkItem) => {
    setMenuOpen(false)
    if (link.isHash) {
      if (location.pathname === '/home') {
        const target = document.querySelector(link.href)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        navigate(`/home${link.href}`)
      }
    } else {
      navigate(link.href)
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
              onClick={() => handleNavClick(link)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop CTA buttons */}
        <div className={styles.desktopCta}>
          {isLoggedIn ? (
            <Link to={role === 'super_admin' ? '/admin' : `/dashboard/${role || 'planner'}`} className={styles.userLink} id="navbar-user-link">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className={styles.navAvatarImg} />
              ) : (
                <span className={styles.navAvatar}>{avatarLetter}</span>
              )}
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
                onClick={() => handleNavClick(link)}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <div className={styles.mobileCta}>
            {isLoggedIn ? (
              <Link
                to={role === 'super_admin' ? '/admin' : `/dashboard/${role}`}
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
