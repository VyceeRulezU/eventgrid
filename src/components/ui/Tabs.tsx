import type { ReactNode } from 'react'
import styles from './Tabs.module.css'

export interface TabItem<T extends string> {
  key: T
  label: string
  icon?: ReactNode
  badge?: ReactNode
}

interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[] | TabItem<T>[]
  activeTab: T
  onChange: (key: T) => void
}

export function Tabs<T extends string>({ tabs, activeTab, onChange }: TabsProps<T>) {
  return (
    <div className={styles.tabContainer}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab
        return (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tabBtn} ${isActive ? styles.tabBtnActive : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.icon && <span className={styles.tabIcon}>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge !== null && (
              <span className={`${styles.tabBadge} ${isActive ? styles.tabBadgeActive : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
