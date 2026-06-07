import { NavLink } from 'react-router-dom'
import { Calendar, CircleDollarSign, Users, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { useEventStore } from '@/store/event.store'
import styles from './BottomTabBar.module.css'

export function BottomTabBar() {
  const role = useAuthStore((s) => s.role)
  const activeEvent = useEventStore((s) => s.activeEvent)

  const items = [
    { to: `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
  ]

  if (role === 'planner') {
    const financialsUrl = activeEvent?.id ? `/events/${activeEvent.id}/financials` : '/financials'
    items.push({ to: financialsUrl, label: 'Financials', icon: CircleDollarSign })
  }

  items.push({ to: '/vendors', label: 'Vendors', icon: Users })

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
