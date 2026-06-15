import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Menu, LogOut, Settings } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import styles from './TopBar.module.css'

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard/planner':   { title: 'Dashboard', subtitle: 'Overview of your events and tasks' },
  '/dashboard/coordinator': { title: 'Dashboard', subtitle: 'Your assigned projects' },
  '/events':               { title: 'Events', subtitle: 'Manage all your events' },
  '/events/new':           { title: 'Create Event', subtitle: 'Set up a new event' },
  '/financials':           { title: 'Financials', subtitle: 'Track payments and budgets' },
  '/vendors':              { title: 'Vendors', subtitle: 'Manage your vendor directory' },
  '/settings':             { title: 'Settings', subtitle: 'Profile and preferences' },
  '/admin':                { title: 'Dashboard', subtitle: 'Platform overview' },
  '/admin/analytics':      { title: 'Analytics', subtitle: 'Platform metrics' },
  '/admin/manage':         { title: 'Manage', subtitle: 'User and account management' },
  '/admin/feedback':       { title: 'Feedback', subtitle: 'User feedback and support' },
  '/admin/team':           { title: 'Admin Team', subtitle: 'Manage super admins' },
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setSidebarOpen } = useUIStore()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  const meta = routeMeta[location.pathname] ?? getDynamicMeta(location.pathname)
  const isEventDetail = /^\/events\/[^/]+$/.test(location.pathname)
  const showBack = isEventDetail

  function getDynamicMeta(path: string): { title: string; subtitle: string } {
    if (/^\/events\/[^/]+\/financials$/.test(path)) return { title: 'Financials', subtitle: 'Track payments and budgets' }
    if (/^\/events\/[^/]+$/.test(path)) return { title: 'Event Dashboard', subtitle: '' }
    return { title: 'EventGrid', subtitle: '' }
  }

  const handleLogout = async () => {
    setUserMenuOpen(false)
    await supabase.auth.signOut()
    clearAuth()
    navigate('/')
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
        <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          <Menu size={20} />
        </button>
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
        {org?.show_beta_label !== false && <span className={styles.betaBadge}>Beta</span>}
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

        <div className={styles.userBtnWrap} ref={menuRef}>
          <button className={styles.userBtn} onClick={() => setUserMenuOpen((p) => !p)} aria-label="User menu">
            <span
              className={styles.userAvatar}
              style={avatarUrl ? { backgroundImage: `url(${avatarUrl})` } : undefined}
            >
              {!avatarUrl && avatarLetter}
            </span>
            <span className={styles.userName}>{displayName}</span>
          </button>
          {userMenuOpen && (
            <div className={styles.userDropdown}>
              <Link to="/settings" className={styles.userDropdownItem} onClick={() => setUserMenuOpen(false)}>
                <Settings size={16} />
                Settings
              </Link>
              <button className={styles.userDropdownItem} onClick={handleLogout}>
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
