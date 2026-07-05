import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './Navbar.module.css'

import weddingImg from '@/assets/images/wedding_event_hall.png'
import corporateImg from '@/assets/images/corporate_event_hall.png'
import traditionalImg from '@/assets/images/traditional_event.png'

interface NavLinkItem {
  label: string
  href: string
  isHash: boolean
}

const NAV_LINKS: NavLinkItem[] = [
  { label: 'For Planners', href: '/planners', isHash: false },
  { label: 'For Coordinators', href: '/coordinators', isHash: false },
  { label: 'For Vendors', href: '/vendors-landing', isHash: false },
]

interface MegaMenuItem {
  key: string
  title: string
  desc: string
  image: string
  href: string
}

const PLATFORM_FEATURES: MegaMenuItem[] = [
  {
    key: 'pipeline',
    title: 'Event Pipeline',
    desc: 'Organize timelines into milestone phases.',
    image: weddingImg,
    href: '/features/pipeline',
  },
  {
    key: 'live-board',
    title: 'Live Board',
    desc: 'Real-time check-in operational dashboard.',
    image: corporateImg,
    href: '/features/live-board',
  },
  {
    key: 'client-portal',
    title: 'Client Portal',
    desc: 'Stakeholder visibility and progress tracking.',
    image: traditionalImg,
    href: '/features/client-portal',
  },
  {
    key: 'vendor-tracker',
    title: 'Vendor Tracker',
    desc: 'Search, filter, and coordinate vendor teams.',
    image: corporateImg,
    href: '/features/vendor-tracker',
  },
  {
    key: 'aftermath',
    title: 'Aftermath Reports',
    desc: 'Analytical Naira budgets and payout reports.',
    image: weddingImg,
    href: '/features/aftermath-reports',
  },
]

const COMPANY_LINKS: MegaMenuItem[] = [
  {
    key: 'about',
    title: 'About Us',
    desc: 'Our mission to power Nigerian event teams.',
    image: traditionalImg,
    href: '/about',
  },
  {
    key: 'blog',
    title: 'Blog & Insights',
    desc: 'Tips and tricks for premium planner success.',
    image: corporateImg,
    href: '/blog',
  },
  {
    key: 'contact',
    title: 'Contact Sales',
    desc: 'Deploy custom setups for enterprise clients.',
    image: weddingImg,
    href: '/contact',
  },
]

interface NavbarProps {
  landing?: boolean
}

export default function Navbar({ landing }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuOpenRef = useRef(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const lastScrollY = useRef(0)
  
  /* ── Sync menuOpen state to ref for scroll handler (avoids stale closure) ── */
  useEffect(() => { menuOpenRef.current = menuOpen }, [menuOpen])

  // Mega Menu state
  const [showMega, setShowMega] = useState(false)
  const [hoveredFeature, setHoveredFeature] = useState<MegaMenuItem>(PLATFORM_FEATURES[0])

  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)
  const location = useLocation()
  const navigate = useNavigate()
  const isLoggedIn = !!user
  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null

  /* ── Scroll detection + hide/show on direction ── */
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 60)
      if (y > lastScrollY.current && y > 80 && !menuOpenRef.current) {
        setHidden(true)
      } else if (y < lastScrollY.current) {
        setHidden(false)
      }
      lastScrollY.current = y
    }
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

  const handleMegaLinkClick = (href: string) => {
    setShowMega(false)
    setMenuOpen(false)
    if (href.startsWith('#')) {
      if (location.pathname === '/home') {
        const target = document.querySelector(href)
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' })
        }
      } else {
        navigate(`/home${href}`)
      }
    } else {
      navigate(href)
    }
  }

  return (
    <motion.header
      className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
      animate={{ y: hidden ? -86 : 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      ref={menuRef}
    >
      <div className={styles.container}>
        <Link to="/home" className={styles.logo} aria-label="NaliGrid home">
          <img src="/ng-logo-wg.svg" alt="NaliGrid" className={`${styles.logoImg} ${landing ? styles.landingLogo : ''}`} />
        </Link>

        {/* Desktop nav links */}
        <nav className={styles.desktopNav} aria-label="Main navigation">
          {NAV_LINKS.map((link) => {
            const isActive = location.pathname === link.href
            return (
              <button
                key={link.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={() => handleNavClick(link)}
              >
                {link.label}
              </button>
            )
          })}

          {/* More Features Menu trigger */}
          <div
            className={styles.megaMenuWrapper}
            onMouseEnter={() => setShowMega(true)}
            onMouseLeave={() => setShowMega(false)}
          >
            <button className={`${styles.navLink} ${styles.triggerBtn}`}>
              More Features <ChevronDown size={14} className={`${styles.chevron} ${showMega ? styles.chevronOpen : ''}`} />
            </button>

            {showMega && (
              <div className={styles.megaMenuContainer}>
                <div className={styles.megaMenuInner}>
                  {/* Dynamic Preview Left Panel */}
                  <div style={{ backgroundImage: `url(${hoveredFeature.image})` }} className={styles.megaMenuLeft}>
                    <div className={styles.megaMenuOverlay} />
                    <div className={styles.megaMenuLeftContent}>
                      <div className={styles.megaMenuLeftTitle}>{hoveredFeature.title}</div>
                      <div className={styles.megaMenuLeftDesc}>{hoveredFeature.desc}</div>
                    </div>
                  </div>

                  {/* Grid columns */}
                  <div className={styles.megaMenuCols}>
                    {/* Platform Features column */}
                    <div className={styles.megaMenuCol}>
                      <div className={styles.megaMenuColTitle}>Platform Features</div>
                      {PLATFORM_FEATURES.map((item) => {
                        const mmActive = location.pathname === item.href
                        return (
                          <button
                            key={item.key}
                            className={`${styles.megaMenuItem} ${mmActive ? styles.megaMenuItemActive : ''}`}
                            onMouseEnter={() => setHoveredFeature(item)}
                            onClick={() => handleMegaLinkClick(item.href)}
                          >
                            <div className={styles.megaMenuItemTitle}>{item.title}</div>
                            <div className={styles.megaMenuItemDesc}>{item.desc}</div>
                          </button>
                        )
                      })}
                    </div>

                    {/* Company column */}
                    <div className={styles.megaMenuCol}>
                      <div className={styles.megaMenuColTitle}>Company</div>
                      {COMPANY_LINKS.map((item) => {
                        const mmActive = location.pathname === item.href
                        return (
                          <button
                            key={item.key}
                            className={`${styles.megaMenuItem} ${mmActive ? styles.megaMenuItemActive : ''}`}
                            onMouseEnter={() => setHoveredFeature(item)}
                            onClick={() => handleMegaLinkClick(item.href)}
                          >
                            <div className={styles.megaMenuItemTitle}>{item.title}</div>
                            <div className={styles.megaMenuItemDesc}>{item.desc}</div>
                          </button>
                        )
                      })}

                      {/* Register for Free button */}
                      <Link to="/register" className={styles.megaMenuCtaBtn} onClick={() => setShowMega(false)}>
                        Register for Free →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
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
          <div className={styles.mobileNavScrollWrapper}>
            <nav className={styles.mobileNav} aria-label="Main navigation">
              <div className={styles.mobileNavHeader}>Products & Audiences</div>
              {NAV_LINKS.map((link) => {
                const isActive = location.pathname === link.href
                return (
                  <button
                    key={link.href}
                    className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}
                    onClick={() => handleNavClick(link)}
                  >
                    {link.label}
                  </button>
                )
              })}

              <div className={styles.mobileNavHeader} style={{ marginTop: 'var(--space-4)' }}>Platform Features</div>
              {PLATFORM_FEATURES.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <button
                    key={item.key}
                    className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}
                    onClick={() => handleMegaLinkClick(item.href)}
                  >
                    {item.title}
                  </button>
                )
              })}

              <div className={styles.mobileNavHeader} style={{ marginTop: 'var(--space-4)' }}>Company</div>
              {COMPANY_LINKS.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <button
                    key={item.key}
                    className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}
                    onClick={() => handleMegaLinkClick(item.href)}
                  >
                    {item.title}
                  </button>
                )
              })}
            </nav>
          </div>
          
          <div className={styles.mobileCta}>
            {isLoggedIn ? (
              <Link
                to={role === 'super_admin' ? '/admin' : `/dashboard/${role}`}
                className={styles.userLink}
                onClick={() => setMenuOpen(false)}
                style={{ justifyContent: 'center', width: '100%' }}
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className={styles.navAvatarImg} />
                ) : (
                  <span className={styles.navAvatar}>{avatarLetter}</span>
                )}
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
    </motion.header>
  )
}
