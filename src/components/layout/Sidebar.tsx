import { useState } from 'react'
import { NavLink, useNavigate, Link, useParams } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Wallet, Users, BookOpen,
  Settings, LogOut, X, ArrowLeft, ListChecks, Radio,
  FileText, TrendingUp, Send, MessageSquare, Bell,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { useUIStore } from '@/store/ui.store'
import { useEventStore } from '@/store/event.store'
import { supabase } from '@/lib/supabase'
import { FeedbackFormModal } from '@/features/feedback/FeedbackFormModal'
import styles from './Sidebar.module.css'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
}

type NavCategory = {
  label: string
  items: NavItem[]
}

export function Sidebar() {
  const role = useAuthStore((s) => s.role)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const activeEvent = useEventStore((s) => s.activeEvent)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const navigate = useNavigate()
  const { id: eventId } = useParams<{ id: string }>()

  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  const mainItems: NavItem[] = [
    { to: role === 'team_member' || !role ? '/events' : role === 'super_admin' ? '/admin' : `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/dashboard/my-tasks', label: 'My Tasks', icon: ListChecks },
  ]

  const managementItems: NavItem[] = [
    { to: '/events', label: 'Events', icon: Calendar },
  ]

  if (role === 'planner') {
    const financialsUrl = activeEvent?.id
      ? `/events/${activeEvent.id}/financials`
      : '/financials'
    managementItems.push({ to: financialsUrl, label: 'Financials', icon: Wallet })
  }

  managementItems.push({ to: '/vendors', label: 'Vendors', icon: Users })
  managementItems.push({ to: '/vendors/directory', label: 'Vendor Directory', icon: BookOpen })

  const categories: NavCategory[] = [
    { label: 'Main', items: mainItems },
    { label: 'Management', items: managementItems },
  ]

  const eventModules: NavItem[] = eventId
    ? [
        { to: `/events/${eventId}/team`, label: 'Team', icon: Users },
        { to: `/events/${eventId}/vendors`, label: 'Vendors', icon: Users },
        { to: `/events/${eventId}/guests`, label: 'Guests', icon: Calendar },
        { to: `/events/${eventId}/tasks`, label: 'Tasks', icon: ListChecks },
        { to: `/events/${eventId}/live-board`, label: 'Live Feed', icon: Radio },
        { to: `/events/${eventId}/aftermath`, label: 'Aftermath', icon: FileText },
      ]
    : []

  if (eventModules.length > 0) {
    categories.push({ label: 'Event Modules', items: eventModules })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/')
  }

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <Link to="/home" className={styles.logo} onClick={() => setSidebarOpen(false)}>
            <img src="/EventGrid-logo-white.svg" alt="EventGrid" className={styles.logoImg} />
          </Link>
          <button
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav} id="sidebar-nav">
          {categories.map((cat) => (
            <div key={cat.label} className={styles.category}>
              <span className={styles.categoryLabel}>{cat.label}</span>
              {cat.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
          {role === 'super_admin' && (
            <div className={styles.category}>
              <span className={styles.categoryLabel}>Admin</span>
              <NavLink
                to="/admin/analytics"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <TrendingUp size={20} />
                <span>Analytics</span>
              </NavLink>
              <NavLink
                to="/admin/manage"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <ListChecks size={20} />
                <span>Manage</span>
              </NavLink>
              <NavLink
                to="/admin/feedback"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <MessageSquare size={20} />
                <span>Feedback</span>
              </NavLink>
              <NavLink
                to="/admin/team"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Users size={20} />
                <span>Admin Team</span>
              </NavLink>

            </div>
          )}
        </nav>

        {role === 'team_member' && (
          <div className={styles.upgradeBanner}>
            <div className={styles.upgradeBannerTitle}>Want more capabilities?</div>
            <div className={styles.upgradeBannerText}>Upgrade to run your own events.</div>
            <div className={styles.upgradeBannerActions}>
              <button className={styles.upgradeBannerBtn} onClick={() => { navigate('/onboarding/planner'); setSidebarOpen(false) }}>
                Planner
              </button>
              <button className={styles.upgradeBannerBtn} onClick={() => { navigate('/onboarding/coordinator'); setSidebarOpen(false) }}>
                Coordinator
              </button>
            </div>
          </div>
        )}

        <div className={styles.footer}>

          <button className={styles.navItem} id="sidebar-back-to-site" onClick={() => navigate('/home')}>
            <ArrowLeft size={20} />
            <span>Back to site</span>
          </button>
          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Bell size={20} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--color-error)',
                color: '#fff',
                fontSize: 10,
                fontWeight: 700,
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </NavLink>
          {role !== 'super_admin' && (
            <button className={styles.navItem} onClick={() => { setSidebarOpen(false); setShowFeedbackForm(true) }}>
              <Send size={20} />
              <span>Send Feedback</span>
            </button>
          )}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            onClick={() => setSidebarOpen(false)}
          >
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
          <button className={styles.navItem} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <FeedbackFormModal open={showFeedbackForm} onClose={() => setShowFeedbackForm(false)} />
    </>
  )
}
