import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import styles from './Table.module.css'

export interface TableColumn {
  key: string
  label: string
  className?: string
  headerClassName?: string
  renderHeader?: () => ReactNode
}

interface TableProps {
  columns: TableColumn[]
  children: ReactNode
  minWidth?: string
  toolbar?: ReactNode
  bulkBar?: ReactNode
  footer?: ReactNode
  loading?: boolean
  loadingIndicator?: ReactNode
  empty?: boolean
  emptyIcon?: LucideIcon
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
}

export function Table({
  columns,
  children,
  minWidth = '700px',
  toolbar,
  bulkBar,
  footer,
  loading,
  loadingIndicator,
  empty,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle = 'No data',
  emptyDescription,
  emptyAction,
}: TableProps) {
  return (
    <div className={styles.tableCard}>
      {bulkBar && <div className={styles.bulkBar}>{bulkBar}</div>}
      {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

      {loading ? (
        loadingIndicator || (
          <div className={styles.loading}>
            <img src="/ng-new-logo.png" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
            <div className={styles.loadingText}>Loading...</div>
          </div>
        )
      ) : empty ? (
        <div className="empty-state">
          <div className="empty-state__icon"><EmptyIcon size={24} /></div>
          <div className="empty-state__title">{emptyTitle}</div>
          {emptyDescription && <div className="empty-state__description">{emptyDescription}</div>}
          {emptyAction}
        </div>
      ) : (
        <div className={styles.tableScroll}>
          <div className={styles.tableWrap} style={{ minWidth }}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`${styles.th} ${col.headerClassName || ''}`}
                  >
                    {col.renderHeader ? col.renderHeader() : col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {children}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {footer && <div className={styles.tableFooter}>{footer}</div>}
    </div>
  )
}
