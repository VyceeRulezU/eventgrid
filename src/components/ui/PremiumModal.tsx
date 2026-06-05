import { useState } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, HelpCircle } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'
import styles from './PremiumModal.module.css'

type Variant = 'success' | 'error' | 'warning' | 'info' | 'confirm'

interface Action {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

interface PremiumNotification {
  id: string
  variant: Variant
  title: string
  message?: string
  duration?: number
  actions?: Action[]
}

function getIcon(variant: Variant) {
  switch (variant) {
    case 'success': return CheckCircle
    case 'error': return AlertCircle
    case 'warning': return AlertTriangle
    case 'info': return Info
    case 'confirm': return HelpCircle
  }
}

function ModalContent({
  notification,
  onClose,
  noBorder,
}: {
  notification: PremiumNotification
  onClose: () => void
  noBorder?: boolean
}) {
  const [closing, setClosing] = useState(false)
  const Icon = getIcon(notification.variant)

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 200)
  }

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div
        className={`${noBorder ? styles.toastModal : styles.modal} ${closing ? styles.closing : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {!noBorder && <div className={styles.accentLine} />}
        <button className={styles.dismiss} onClick={handleClose} aria-label="Dismiss">
          <X size={16} />
        </button>

        <div className={styles.body}>
          <div className={`${styles.iconWrapper} ${styles[notification.variant]}`}>
            <Icon size={26} />
          </div>
          <div className={styles.title}>{notification.title}</div>
          {notification.message && (
            <div className={styles.message}>{notification.message}</div>
          )}
        </div>

        {notification.actions && notification.actions.length > 0 && (
          <div className={`${styles.actions} ${notification.actions.length > 2 ? styles.column : ''}`}>
            {notification.actions.map((action, i) => {
              const btnClass = action.variant === 'danger'
                ? styles.btnDanger
                : action.variant === 'secondary'
                  ? styles.btnSecondary
                  : styles.btnPrimary
              return (
                <button
                  key={i}
                  className={btnClass}
                  onClick={() => {
                    action.onClick()
                    handleClose()
                  }}
                >
                  {action.label}
                </button>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

export function PremiumModalContainer() {
  const { modalNotification, toastNotifications, dismissModal, dismissToast } = useUIStore()

  return (
    <>
      {modalNotification && (
        <ModalContent
          notification={modalNotification}
          onClose={() => dismissModal()}
        />
      )}

      {toastNotifications.length > 0 && (
        <div className={styles.toastLayer}>
          {toastNotifications.map((n) => (
            <ModalContent
              key={n.id}
              notification={n}
              onClose={() => dismissToast(n.id)}
              noBorder
            />
          ))}
        </div>
      )}
    </>
  )
}
