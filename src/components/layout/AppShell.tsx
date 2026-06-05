import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomTabBar } from './BottomTabBar'
import { TopBar } from './TopBar'
import styles from './AppShell.module.css'

export function AppShell() {
  useEffect(() => {
    document.body.classList.add('shell-active')
    return () => document.body.classList.remove('shell-active')
  }, [])

  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <TopBar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <BottomTabBar />
    </div>
  )
}
