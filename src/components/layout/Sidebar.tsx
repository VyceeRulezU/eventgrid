import { useState, useEffect } from 'react'
import { NavLink, useNavigate, Link, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, Wallet, Users, BookOpen,
  Settings, LogOut, X, ArrowLeft, ListChecks, Radio,
  FileText, TrendingUp, MessageSquare, Bell, Image,
  PanelLeftClose, PanelLeft, Mail, UserPlus, ClipboardList,
  FileSignature, CheckSquare, MessageCircle, Receipt,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useNotificationStore } from '@/store/notification.store'
import { useUIStore } from '@/store/ui.store'
import { useEventStore } from '@/store/event.store'
import { supabase } from '@/lib/supabase'
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)
  const role = useAuthStore((s) => s.role)
  const profile = useAuthStore((s) => s.profile)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { sidebarOpen, setSidebarOpen, sidebarCollapsed, toggleSidebarCollapsed } = useUIStore()
  const activeEvent = useEventStore((s) => s.activeEvent)
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const navigate = useNavigate()
  const { id: eventId } = useParams<{ id: string }>()

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const isAdmin = role === 'super_admin'
  const isAdminRole = role && ['super_admin', 'admin_monitor', 'admin_support'].includes(role)
  const hasOriginalRole = isAdminRole && !!profile?.original_role

  const mainItems: NavItem[] = [
    { to: isAdmin ? '/admin' : isAdminRole ? '/admin' : role === 'team_member' || !role ? '/events' : role === 'client' ? '/vendors/directory' : `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
  ]
  if (role !== 'client' && ((!isAdmin && !isAdminRole) || (isAdminRole && hasOriginalRole))) {
    mainItems.push({ to: isAdmin ? '/admin/my-tasks' : '/dashboard/my-tasks', label: 'My Tasks', icon: ListChecks })
  }

  const managementItems: NavItem[] = []

  if (!isAdmin && (!isAdminRole || hasOriginalRole)) {
    managementItems.push({ to: '/events', label: 'Events', icon: Calendar })
  }

  if (role === 'planner' || hasOriginalRole) {
    const financialsUrl = activeEvent?.id
      ? `/events/${activeEvent.id}/financials`
      : '/financials'
    managementItems.push({ to: financialsUrl, label: 'Financials', icon: Wallet })
  }

  if (!isAdmin && (!isAdminRole || hasOriginalRole)) {
    managementItems.push({ to: '/vendors', label: 'Vendors', icon: Users })
    managementItems.push({ to: '/vendors/directory', label: 'Vendor Directory', icon: BookOpen })
  }

  if (role === 'planner' || role === 'coordinator' || hasOriginalRole) {
    managementItems.push({ to: '/leads', label: 'Leads', icon: UserPlus })
  }

  if (!isAdmin && (!isAdminRole || hasOriginalRole)) {
    managementItems.push({ to: '/calendar', label: 'Calendar', icon: Calendar })
  }

  const categories: NavCategory[] = [
    { label: 'Main', items: mainItems },
    { label: 'Management', items: managementItems },
  ]

  const eventModules: NavItem[] = eventId
    ? [
        { to: `/events/${eventId}`, label: 'Overview', icon: LayoutDashboard },
        { to: `/events/${eventId}/team`, label: 'Team', icon: Users },
        { to: `/events/${eventId}/vendors`, label: 'Vendors', icon: Users },
        { to: `/events/${eventId}/guests`, label: 'Guests', icon: Calendar },
        { to: `/events/${eventId}/tasks`, label: 'Tasks', icon: ListChecks },
        { to: `/events/${eventId}/chat`, label: 'Chat', icon: MessageCircle },
        { to: `/events/${eventId}/live-board`, label: 'Live Feed', icon: Radio },
        { to: `/events/${eventId}/checklists`, label: 'Checklists', icon: CheckSquare },
        { to: `/events/${eventId}/notebook`, label: 'Notebook', icon: BookOpen },
        { to: `/events/${eventId}/proposals`, label: 'Proposals', icon: FileSignature },
        { to: `/events/${eventId}/invoices`, label: 'Invoices', icon: Receipt },
        { to: `/events/${eventId}/questionnaires`, label: 'Surveys', icon: ClipboardList },
        { to: `/events/${eventId}/aftermath`, label: 'Aftermath', icon: FileText },
        { to: `/events/${eventId}/assets`, label: 'Assets', icon: Image },
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
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>
      <motion.aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''} ${sidebarCollapsed ? styles.collapsed : ''}`}
        animate={
          isMobile
            ? { x: sidebarOpen ? 0 : '-100%' }
            : { width: sidebarCollapsed ? 72 : 320, x: 0 }
        }
        transition={{
          type: 'tween',
          duration: 0.12,
          ease: 'easeOut',
        }}
      >
        <div className={styles.header}>
          <Link to="/home" className={styles.logo} onClick={() => setSidebarOpen(false)}>
            <img src="/ng-logo-wg.svg" alt="NaliGrid" className={styles.logoImg} />
            <img src="/ng-new-logo.svg" alt="NaliGrid" className={styles.logoSmall} />
          </Link>
          <button
            className={styles.collapseBtn}
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <button
            className={styles.closeBtn}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav} id="sidebar-nav">
          {categories.filter(c => c.items.length > 0).map((cat) => (
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
          {isAdminRole && (
            <div className={styles.category}>
              <span className={styles.categoryLabel}>Admin</span>
              <NavLink
                to="/admin/my-tasks"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <ListChecks size={20} />
                <span>My Tasks</span>
              </NavLink>
              <NavLink
                to="/admin/events"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Calendar size={20} />
                <span>Events</span>
              </NavLink>
              <NavLink
                to="/admin/vendors"
                end
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Users size={20} />
                <span>Vendors</span>
              </NavLink>
              <NavLink
                to="/admin/vendors/directory"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <BookOpen size={20} />
                <span>Vendor Directory</span>
              </NavLink>
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
              {isAdmin && (
                <NavLink
                  to="/financials"
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.active : ''}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Wallet size={20} />
                  <span>Financials</span>
                </NavLink>
              )}
              {isAdmin && (
                <>
                  <NavLink
                    to="/admin/manage"
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.active : ''}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <ListChecks size={20} />
                    <span>All Users</span>
                  </NavLink>
                  <NavLink
                    to="/admin/team"
                    className={({ isActive }) =>
                      `${styles.navItem} ${isActive ? styles.active : ''}`
                    }
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Users size={20} />
                    <span>Team Members</span>
                  </NavLink>
                </>
              )}
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
                to="/admin/engagement"
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Mail size={20} />
                <span>Engagement</span>
              </NavLink>
            </div>
          )}
        </nav>
        <div className={styles.scrollIndicator} aria-hidden="true" />

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
      </motion.aside>

    </>)
  }
