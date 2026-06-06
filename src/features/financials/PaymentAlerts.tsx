import { AlertTriangle, ArrowRight } from 'lucide-react'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

interface DueVendor {
  vendor_name: string
  balance: number
}

interface DueClient {
  description: string
  amount: number
  due_date: string
}

interface PaymentAlertsProps {
  dueVendors: DueVendor[]
  dueClients: DueClient[]
  totalVendorDue: number
  totalClientDue: number
}

export function PaymentAlerts({ dueVendors, dueClients, totalVendorDue, totalClientDue }: PaymentAlertsProps) {
  const hasAlerts = dueVendors.length > 0 || dueClients.length > 0
  if (!hasAlerts) return null

  return (
    <div style={{ marginBottom: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {dueVendors.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-border)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-warning)', flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
            <strong>{dueVendors.length} vendor payment{dueVendors.length !== 1 ? 's' : ''} due this week</strong> — {formatNaira(totalVendorDue)} total
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => document.getElementById('vendor-payments-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ flexShrink: 0 }}>
            Review <ArrowRight size={14} />
          </button>
        </div>
      )}
      {dueClients.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-accent-muted)', border: '1px solid var(--color-accent-border)', borderRadius: 'var(--radius-lg)', fontSize: 'var(--text-sm)' }}>
          <AlertTriangle size={16} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
            Client balance{totalClientDue > 0 ? ` of ${formatNaira(totalClientDue)}` : ''} due in 14 days
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => document.getElementById('income-section')?.scrollIntoView({ behavior: 'smooth' })} style={{ flexShrink: 0 }}>
            Review <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
