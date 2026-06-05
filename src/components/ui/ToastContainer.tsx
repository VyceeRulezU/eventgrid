import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { useUIStore } from '@/store/ui.store'

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

export function ToastContainer() {
  const { toasts, dismissToast } = useUIStore()

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      top: 'var(--space-4)',
      right: 'var(--space-4)',
      zIndex: 'var(--z-toast)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-2)',
      maxWidth: 360,
    }}>
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        return (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div className="toast__icon">
              <Icon size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div className="toast__title">{toast.title}</div>
              {toast.body && <div className="toast__body">{toast.body}</div>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
