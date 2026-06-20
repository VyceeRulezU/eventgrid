import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { TopBar } from './TopBar'
import { AppTour } from '@/components/shared/AppTour'
import { useUIStore } from '@/store/ui.store'
import styles from './AppShell.module.css'

export function AppShell() {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  useEffect(() => {
    document.body.classList.add('shell-active')
    return () => document.body.classList.remove('shell-active')
  }, [])

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={`${styles.main} ${sidebarCollapsed ? styles.mainCollapsed : ''}`}>
        <TopBar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
      <AppTour />
    </div>
  )
}
