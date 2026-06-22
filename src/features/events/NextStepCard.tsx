import { AlertTriangle, Calendar, ListChecks, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface NextStepCardProps {
  eventId: string
  paymentStatus: string
  daysUntilEvent: number
  preEventChecklistIncomplete: boolean
  overdueTaskCount: number
  currentPhaseStatus: string | null
  currentPhaseNumber: number
}

export function NextStepCard({ eventId, paymentStatus, daysUntilEvent, preEventChecklistIncomplete, overdueTaskCount, currentPhaseStatus, currentPhaseNumber }: NextStepCardProps) {
  const navigate = useNavigate()

  let content: { icon: typeof AlertTriangle; title: string; description: string; action: string; onClick: () => void; urgent: boolean } | null = null

  if (paymentStatus === 'unpaid') {
    content = {
      icon: AlertTriangle,
      title: 'Activate your event',
      description: 'Activate to unlock all event management features.',
      action: 'Activate Free →',
      onClick: () => document.getElementById('payment-section')?.click(),
      urgent: true,
    }
  } else if (daysUntilEvent <= 7 && daysUntilEvent >= 0 && preEventChecklistIncomplete) {
    content = {
      icon: Calendar,
      title: `Event in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`,
      description: 'Pre-event checklist has items remaining.',
      action: 'Go to Checklist →',
      onClick: () => navigate(`/events/${eventId}/tasks`),
      urgent: true,
    }
  } else if (overdueTaskCount > 0) {
    content = {
      icon: ListChecks,
      title: `${overdueTaskCount} task${overdueTaskCount !== 1 ? 's' : ''} overdue`,
      description: 'Review and reassign to keep on track.',
      action: 'Go to Tasks →',
      onClick: () => navigate(`/events/${eventId}/tasks`),
      urgent: false,
    }
  } else if (currentPhaseStatus === 'in_progress') {
    content = {
      icon: Zap,
      title: `Phase ${currentPhaseNumber} in progress`,
      description: 'Keep the momentum going.',
      action: 'Continue →',
      onClick: () => navigate(`/events/${eventId}/live-board`),
      urgent: false,
    }
  }

  if (!content) return null

  const Icon = content.icon

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: 'var(--space-3) var(--space-4)',
      background: content.urgent ? 'var(--color-warning-bg)' : 'var(--color-accent-muted)',
      border: `1px solid ${content.urgent ? 'var(--color-warning-border)' : 'var(--color-accent-border)'}`,
      borderLeft: `3px solid ${content.urgent ? 'var(--color-warning)' : 'var(--color-accent)'}`,
      borderRadius: 'var(--radius-xl)',
      marginBottom: 'var(--space-4)',
      cursor: 'pointer',
      transition: 'box-shadow var(--transition-fast)',
    }}
      onClick={content.onClick}
      onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && content?.onClick()}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)',
        background: content.urgent ? 'var(--color-warning-bg)' : 'var(--color-accent-muted)',
        color: content.urgent ? 'var(--color-warning)' : 'var(--color-accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={18} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{content.title}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{content.description}</div>
      </div>
      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: content.urgent ? 'var(--color-warning)' : 'var(--color-accent)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {content.action}
      </span>
    </div>
  )
}
