import { NavLink, useNavigate, Link, useParams } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, CircleDollarSign, Users, BookOpen,
  Settings, LogOut, X, ArrowLeft, Shield, ListChecks, Radio,
  FileText,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
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
  const role = useAuthStore((s) => s.role)
  const org = useAuthStore((s) => s.org)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const navigate = useNavigate()
  const { id: eventId } = useParams<{ id: string }>()

  const mainItems: NavItem[] = [
    { to: role === 'super_admin' ? '/admin' : `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
  ]

  const managementItems: NavItem[] = [
    { to: '/events', label: 'Events', icon: Calendar },
  ]

  if (role === 'planner') {
    managementItems.push({ to: '/financials', label: 'Financials', icon: CircleDollarSign })
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
        { to: `/events/${eventId}/guests`, label: 'Guests', icon: Calendar },
        { to: `/events/${eventId}/tasks`, label: 'Tasks', icon: ListChecks },
        { to: `/events/${eventId}/live-board`, label: 'Live Board', icon: Radio },
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
          <Link to="/" className={styles.logo} onClick={() => setSidebarOpen(false)}>
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

        <nav className={styles.nav}>
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
                to="/admin"
                end
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
                onClick={() => setSidebarOpen(false)}
              >
                <Shield size={20} />
                <span>Admin</span>
              </NavLink>
            </div>
          )}
        </nav>

        <div className={styles.footer}>
          {!org && (
            <div className={styles.onboardingBanner}>
              <div className={styles.onboardingBannerTitle}>Finish setting up</div>
              <div className={styles.onboardingBannerText}>Complete onboarding to unlock all features</div>
              <button
                className={styles.onboardingBannerBtn}
                onClick={() => { navigate('/onboarding/planner'); setSidebarOpen(false) }}
              >
                Complete Onboarding
              </button>
            </div>
          )}
          <button className={styles.navItem} onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
            <span>Back to site</span>
          </button>
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
    </>
  )
}
