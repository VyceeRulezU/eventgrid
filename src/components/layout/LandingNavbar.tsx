import { Link } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './LandingNavbar.module.css'

export function LandingNavbar() {
  const user = useAuthStore((s) => s.user)
  const role = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)

  const isLoggedIn = !!user
  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : 'U'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link to="/" className={styles.logo}>
          NaliGrid
        </Link>

        <nav className={styles.nav} aria-label="Main navigation">
          {isLoggedIn ? (
            <>
              <Link to={`/dashboard/${role || 'planner'}`} className={styles.btnGoldSm}>
                <LayoutDashboard size={16} />
                Dashboard
              </Link>
              <Link to={`/dashboard/${role || 'planner'}`} className={styles.userLink}>
                <span className={styles.avatar}>{avatarLetter}</span>
                <span className={styles.userName}>{displayName}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>
                Sign In
              </Link>
              <Link to="/register" className={styles.btnGoldSm}>
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
