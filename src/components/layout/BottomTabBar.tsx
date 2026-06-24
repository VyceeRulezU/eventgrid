import { NavLink } from 'react-router-dom'
import { Calendar, CircleDollarSign, Users, LayoutDashboard, ListChecks } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useEventStore } from '@/store/event.store'
import styles from './BottomTabBar.module.css'

export function BottomTabBar() {
  const role = useAuthStore((s) => s.role)
  const activeEvent = useEventStore((s) => s.activeEvent)
  const isAdmin = role === 'super_admin'

  const items = [
    { to: isAdmin ? '/admin' : role === 'team_member' || !role ? '/events' : `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: isAdmin ? '/admin/my-tasks' : '/dashboard/my-tasks', label: 'My Tasks', icon: ListChecks },
    { to: isAdmin ? '/admin/events' : '/events', label: 'Events', icon: Calendar },
  ]

  if (role === 'planner' || role === 'super_admin') {
    const financialsUrl = activeEvent?.id ? `/events/${activeEvent.id}/financials` : '/financials'
    items.push({ to: financialsUrl, label: 'Financials', icon: CircleDollarSign })
  }

  items.push({ to: isAdmin ? '/admin/vendors' : '/vendors', label: 'Vendors', icon: Users })

  return (
    <nav className={styles.tabBar}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end
          className={({ isActive }) => `${styles.tabItem} ${isActive ? styles.active : ''}`}
        >
          <item.icon size={20} />
          <span className={styles.tabLabel}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
