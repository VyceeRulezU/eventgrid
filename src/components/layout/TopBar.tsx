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
  '/leads':                { title: 'Leads', subtitle: 'Track and convert prospects' },
  '/proposals':            { title: 'Proposals', subtitle: 'Create and send proposals' },
  '/calendar':             { title: 'Calendar', subtitle: 'View events and tasks' },
  '/dashboard/planner':   { title: 'Dashboard', subtitle: 'Overview of your events and tasks' },
  '/dashboard/coordinator': { title: 'Dashboard', subtitle: 'Your assigned projects' },
  '/dashboard/my-tasks':   { title: 'My Tasks', subtitle: 'Tasks assigned to you across all events' },
  '/events':               { title: 'Events', subtitle: 'Manage all your events' },
  '/events/new':           { title: 'Create Event', subtitle: 'Set up a new event' },
  '/financials':           { title: 'Financials', subtitle: 'Track payments and budgets' },
  '/vendors':              { title: 'Vendors', subtitle: 'Manage your vendor directory' },
  '/vendors/directory':    { title: 'Vendor Directory', subtitle: 'Browse and contact vendors' },
  '/notifications':        { title: 'Notifications', subtitle: 'View all your notifications' },
  '/settings':             { title: 'Settings', subtitle: 'Profile and preferences' },
  '/admin':                { title: 'Dashboard', subtitle: 'Platform overview' },
  '/admin/analytics':      { title: 'Analytics', subtitle: 'Platform metrics' },
  '/admin/manage':         { title: 'All Users', subtitle: 'Users, events and payments across the platform' },
  '/admin/feedback':       { title: 'Feedback', subtitle: 'User feedback and support' },
  '/admin/team':           { title: 'Admin Team', subtitle: 'Manage super admins' },
  '/admin/referrals':      { title: 'Referrals', subtitle: 'Referral partner commissions' },
  '/admin/engagement':     { title: 'Engagement', subtitle: 'Survey responses, referrals, and email marketing' },
  '/admin/events':         { title: 'Events', subtitle: 'Manage all events' },
  '/admin/vendors':        { title: 'Vendors', subtitle: 'Manage vendor directory' },
  '/admin/vendors/directory': { title: 'Vendor Directory', subtitle: 'Browse global vendor directory' },
  '/admin/vendors/approvals': { title: 'Approvals', subtitle: 'Review vendor claims' },
  '/admin/testimonials':   { title: 'Testimonials', subtitle: 'Manage testimonials' },
  '/admin/my-tasks':       { title: 'My Tasks', subtitle: 'Admin tasks across all events' },
  '/dashboard/vendor':     { title: 'Vendor Dashboard', subtitle: 'Your events, listings and quotes' },
  '/vendors':              { title: 'Vendors', subtitle: 'Manage your vendor directory' },
  '/vendors/directory':    { title: 'Vendor Directory', subtitle: 'Browse and contact vendors' },
  '/dashboard/client':     { title: 'Dashboard', subtitle: 'Your events and quotes' },
  '/client/create-event':  { title: 'Create Event', subtitle: 'Tell us about your event' },
  '/client/request-quote': { title: 'Request Quote', subtitle: 'Get quotes from service providers' },
  '/client/browse-quotes': { title: 'Provider Quotes', subtitle: 'Browse and respond to open requests' },
}

export function TopBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { setSidebarOpen } = useUIStore()
  const profile = useAuthStore((s) => s.profile)
  const user = useAuthStore((s) => s.user)
  const org = useAuthStore((s) => s.org)
  const betaLabelVisible = useAuthStore((s) => s.betaLabelVisible)
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
  const isEventModule = /^\/events\/[^/]+\/(team|tasks|vendors|guests|live-board|aftermath|assets|financials|report|proposals|invoices|checklists|notebook)$/.test(location.pathname)
  const showBack = isEventDetail || isEventModule

  function getDynamicMeta(path: string): { title: string; subtitle: string } {
    if (/^\/events\/[^/]+\/financials$/.test(path)) return { title: 'Financials', subtitle: 'Track payments and budgets' }
    if (/^\/events\/[^/]+\/team$/.test(path)) return { title: 'Team', subtitle: 'Manage your event team' }
    if (/^\/events\/[^/]+\/tasks$/.test(path)) return { title: 'Task Board', subtitle: 'Track and manage tasks' }
    if (/^\/events\/[^/]+\/vendors$/.test(path)) return { title: 'Vendors', subtitle: 'Assigned vendors' }
    if (/^\/events\/[^/]+\/guests$/.test(path)) return { title: 'Guests', subtitle: 'Manage guest list' }
    if (/^\/events\/[^/]+\/live-board$/.test(path)) return { title: 'Live Feed', subtitle: 'Real-time event updates' }
    if (/^\/events\/[^/]+\/aftermath$/.test(path)) return { title: 'Aftermath', subtitle: 'Event reports' }
    if (/^\/events\/[^/]+\/assets$/.test(path)) return { title: 'Assets', subtitle: 'Inspiration and assets' }
    if (/^\/events\/[^/]+\/report$/.test(path)) return { title: 'Event Report', subtitle: '' }
    if (/^\/events\/[^/]+\/proposals$/.test(path)) return { title: 'Proposals', subtitle: 'Create and send proposals' }
    if (/^\/events\/[^/]+\/invoices$/.test(path)) return { title: 'Invoices', subtitle: 'Send invoices and track payments' }
    if (/^\/events\/[^/]+\/checklists$/.test(path)) return { title: 'Checklists', subtitle: 'Event task checklists' }
    if (/^\/events\/[^/]+\/notebook$/.test(path)) return { title: 'Notebook', subtitle: 'Event notes and ideas' }
    if (/^\/events\/[^/]+$/.test(path)) return { title: 'Event Dashboard', subtitle: '' }
    return { title: 'NaliGrid', subtitle: '' }
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
        {betaLabelVisible && <span className={styles.betaBadge}>Beta</span>}
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
