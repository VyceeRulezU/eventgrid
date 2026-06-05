import { NavLink } from 'react-router-dom'
import { Calendar, CircleDollarSign, Users, LayoutDashboard } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import styles from './BottomTabBar.module.css'

export function BottomTabBar() {
  const role = useAuthStore((s) => s.role)

  const items = [
    { to: `/dashboard/${role}`, label: 'Dashboard', icon: LayoutDashboard },
    { to: '/events', label: 'Events', icon: Calendar },
  ]

  if (role === 'planner') {
    items.push({ to: '/financials', label: 'Financials', icon: CircleDollarSign })
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
