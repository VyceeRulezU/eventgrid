import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Sun, Moon, Bell } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { Link } from 'react-router-dom'
import styles from './TopBar.module.css'

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard/planner':   { title: 'Dashboard', subtitle: 'Overview of your events and tasks' },
  '/dashboard/coordinator': { title: 'Dashboard', subtitle: 'Your assigned projects' },
  '/events':               { title: 'Events', subtitle: 'Manage all your events' },
  '/events/new':           { title: 'Create Event', subtitle: 'Set up a new event' },
  '/financials':           { title: 'Financials', subtitle: 'Track payments and budgets' },
  '/vendors':              { title: 'Vendors', subtitle: 'Manage your vendor directory' },
  '/settings':             { title: 'Settings', subtitle: 'Profile and preferences' },
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useUIStore()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const meta = routeMeta[location.pathname] ?? getDynamicMeta(location.pathname)
  const isEventDetail = /^\/events\/[^/]+$/.test(location.pathname)
  const showBack = isEventDetail

  function getDynamicMeta(path: string): { title: string; subtitle: string } {
    if (/^\/events\/[^/]+$/.test(path)) return { title: 'Event Dashboard', subtitle: '' }
    return { title: 'EventGrid', subtitle: '' }
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || ''
  const avatarUrl = profile?.avatar_url || org?.logo_url || null
  const avatarLetter = displayName
    ? displayName.charAt(0).toUpperCase()
    : org?.name
      ? org.name.charAt(0).toUpperCase()
      : 'U'

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.iconBtn} onClick={() => navigate(-1)} aria-label="Go back">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>{meta.title}</h1>
          {meta.subtitle && (
            <>
              <span className={styles.pipe}>|</span>
              <p className={styles.subtitle}>{meta.subtitle}</p>
            </>
          )}
        </div>
      </div>
      <div className={styles.right}>
        <button className={styles.iconBtn} onClick={() => useNotificationStore.getState().setDrawerOpen(true)} aria-label="Notifications" style={{ position: 'relative' }}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 16, height: 16, borderRadius: '50%',
              background: 'var(--color-error)', color: '#fff',
              fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <Link to="/settings" className={styles.userBtn} aria-label="Settings">
          <span
            className={styles.userAvatar}
            style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
          >
            {!avatarUrl && avatarLetter}
          </span>
          <span className={styles.userName}>{displayName}</span>
        </Link>
      </div>
    </header>
  )
}
