import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { ClipboardList, Eye, X, BarChart3, List } from 'lucide-react'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { Table } from '@/components/ui/Table'
import { supabase } from '@/lib/supabase'

interface SurveyResponse {
  id: string
  respondent_name: string | null
  respondent_email: string | null
  respondent_role: string | null
  open_to_software: boolean
  currently_using: boolean
  current_software_names: string | null
  preferred_billing: string | null
  pay_per_event: string | null
  monthly_amount: string | null
  quarterly_amount: string | null
  yearly_amount: string | null
  important_features: string[]
  wanted_features: string | null
  additional_feedback: string | null
  created_at: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const ROLE_LABELS: Record<string, string> = {
  planner: 'Planner',
  coordinator: 'Coordinator',
  both: 'Both',
  other: 'Other',
}

const BILLING_LABELS: Record<string, string> = {
  per_event: 'Per Event',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart3 },
  { key: 'responses', label: 'Responses', icon: List },
] as const

function Bar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)' }}>
      <span style={{ width: 140, flexShrink: 0, textAlign: 'right', color: 'var(--color-text-secondary)' }}>{label}</span>
      <div style={{ flex: 1, height: 20, background: 'var(--color-surface-3)', borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.3s' }} />
      </div>
      <span style={{ width: 60, flexShrink: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>{count} ({pct}%)</span>
    </div>
  )
}

function OverviewTab({ responses }: { responses: SurveyResponse[] }) {
  const total = responses.length

  const openToSoftware = useMemo(() => responses.filter(r => r.open_to_software).length, [responses])
  const currentlyUsing = useMemo(() => responses.filter(r => r.currently_using).length, [responses])

  const roleCounts = useMemo(() => {
    const map: Record<string, number> = {}
    responses.forEach(r => { const k = r.respondent_role || 'unknown'; map[k] = (map[k] || 0) + 1 })
    return map
  }, [responses])

  const billingCounts = useMemo(() => {
    const map: Record<string, number> = {}
    responses.forEach(r => { const k = r.preferred_billing || 'unspecified'; map[k] = (map[k] || 0) + 1 })
    return map
  }, [responses])

  const featureCounts = useMemo(() => {
    const map: Record<string, number> = {}
    responses.forEach(r => (r.important_features || []).forEach(f => { map[f] = (map[f] || 0) + 1 }))
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [responses])

  if (total === 0) {
    return (
      <div style={{ padding: 'var(--space-10)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        <BarChart3 size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
        <p>No data yet. Share the survey link to start collecting responses.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-4)' }}>
        <div className="stat-card">
          <div className="stat-card__value">{total}</div>
          <div className="stat-card__label">Total Responses</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{openToSoftware}</div>
          <div className="stat-card__label">Open to Software</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{currentlyUsing}</div>
          <div className="stat-card__label">Currently Using</div>
        </div>
      </div>

      <div className="overview-card">
        <h3 className="overview-card__title">Open to Event Planning Software</h3>
        <Bar label="Yes" count={openToSoftware} total={total} color="#22c55e" />
        <Bar label="No" count={total - openToSoftware} total={total} color="#ef4444" />
      </div>

      <div className="overview-card">
        <h3 className="overview-card__title">Currently Using Event Planning Software</h3>
        <Bar label="Yes" count={currentlyUsing} total={total} color="#22c55e" />
        <Bar label="No" count={total - currentlyUsing} total={total} color="#ef4444" />
      </div>

      <div className="overview-card">
        <h3 className="overview-card__title">Respondent Role</h3>
        {Object.entries(roleCounts).map(([key, count]) => (
          <Bar key={key} label={ROLE_LABELS[key] || key} count={count} total={total} color="#d4a017" />
        ))}
      </div>

      <div className="overview-card">
        <h3 className="overview-card__title">Billing Preference</h3>
        {Object.entries(billingCounts).map(([key, count]) => (
          <Bar key={key} label={BILLING_LABELS[key] || key} count={count} total={total} color="#6366f1" />
        ))}
      </div>

      <div className="overview-card">
        <h3 className="overview-card__title">Most Important Features</h3>
        {featureCounts.slice(0, 10).map(([feature, count]) => (
          <Bar key={feature} label={feature} count={count} total={total} color="#a855f7" />
        ))}
      </div>
    </div>
  )
}

export function AdminSurveyResponsesPage() {
  const role = useAuthStore((s) => s.role)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SurveyResponse | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'responses'>('overview')

  useEffect(() => {
    supabase
      .from('survey_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setResponses((data || []) as SurveyResponse[])
        setLoading(false)
      })
  }, [])

  if (role !== 'super_admin') return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <AdminPageHero
        icon={ClipboardList}
        title="Survey Responses"
        subtitle={`${responses.length} submission${responses.length !== 1 ? 's' : ''}`}
        backTo="/admin"
      />

      <div style={{ display: 'flex', gap: 0, padding: '0 var(--space-6)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: 'var(--space-3) var(--space-4)',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--color-accent)' : '2px solid transparent',
                cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'overview' ? (
        <div style={{ padding: 'var(--space-5) var(--space-6)', flex: 1, overflow: 'auto' }}>
          <OverviewTab responses={responses} />
        </div>
      ) : (
        <div style={{ padding: 'var(--space-5) var(--space-6)', flex: 1, overflow: 'auto' }}>
          <Table
            columns={[
              { key: 'date', label: 'Date' },
              { key: 'name', label: 'Name' },
              { key: 'role', label: 'Role' },
              { key: 'billing', label: 'Billing' },
              { key: 'amount', label: 'Amt' },
              { key: 'features', label: 'Features' },
              { key: 'actions', label: '' },
            ]}
            minWidth="900px"
            loading={loading}
            empty={!loading && responses.length === 0}
            emptyIcon={ClipboardList}
            emptyTitle="No responses yet"
            emptyDescription="Share the survey link to start collecting responses."
          >
            {responses.map((r) => (
              <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(r)}>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {formatDate(r.created_at)}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {r.respondent_name || 'Anonymous'}
                  </span>
                  {r.respondent_email && (
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{r.respondent_email}</div>
                  )}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {ROLE_LABELS[r.respondent_role || ''] || r.respondent_role || '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  {BILLING_LABELS[r.preferred_billing || ''] || '—'}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {r.preferred_billing === 'per_event' ? (r.pay_per_event || '—') : ''}
                  {r.preferred_billing === 'monthly' ? (r.monthly_amount || '—') : ''}
                  {r.preferred_billing === 'quarterly' ? (r.quarterly_amount || '—') : ''}
                  {r.preferred_billing === 'yearly' ? (r.yearly_amount || '—') : ''}
                  {!r.preferred_billing ? '—' : ''}
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  {r.important_features?.length || 0} selected
                </td>
                <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setSelected(r) }}
                    style={{
                      background: 'none', border: 'none', color: 'var(--color-accent)',
                      cursor: 'pointer', padding: '4px', borderRadius: 'var(--radius-sm)',
                      display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)',
                      fontWeight: 600,
                    }}
                  >
                    <Eye size={14} /> View
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-card__header">
              <h3 className="modal-card__title">
                <ClipboardList size={16} /> Survey Response
              </h3>
              <button className="modal-card__close" onClick={() => setSelected(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-card__body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div>
                <div className="input-label">Respondent</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {selected.respondent_name || 'Anonymous'}
                  {selected.respondent_email && (
                    <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 8 }}>{selected.respondent_email}</span>
                  )}
                </div>
              </div>
              <div>
                <div className="input-label">Role</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{ROLE_LABELS[selected.respondent_role || ''] || selected.respondent_role || '—'}</div>
              </div>
              <div>
                <div className="input-label">Submitted</div>
                <div style={{ fontSize: 'var(--text-sm)' }}>{formatDate(selected.created_at)}</div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />
              <div>
                <div className="input-label">Open to Event Planning Software</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {selected.open_to_software ? 'Yes' : 'No'}
                </div>
              </div>
              <div>
                <div className="input-label">Currently Using Event Planning Software</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {selected.currently_using ? 'Yes' : 'No'}
                </div>
              </div>
              {selected.currently_using && selected.current_software_names && (
                <div>
                  <div className="input-label">Current Software(s)</div>
                  <div style={{ fontSize: 'var(--text-sm)' }}>{selected.current_software_names}</div>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />
              <div>
                <div className="input-label">Billing Preference</div>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  {BILLING_LABELS[selected.preferred_billing || ''] || '—'}
                </div>
              </div>
              {selected.preferred_billing === 'per_event' && (
                <div>
                  <div className="input-label">Per Event Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selected.pay_per_event || '—'}</div>
                </div>
              )}
              {selected.preferred_billing === 'monthly' && (
                <div>
                  <div className="input-label">Monthly Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selected.monthly_amount || '—'}</div>
                </div>
              )}
              {selected.preferred_billing === 'quarterly' && (
                <div>
                  <div className="input-label">Quarterly Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selected.quarterly_amount || '—'}</div>
                </div>
              )}
              {selected.preferred_billing === 'yearly' && (
                <div>
                  <div className="input-label">Yearly Amount</div>
                  <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{selected.yearly_amount || '—'}</div>
                </div>
              )}
              <hr style={{ border: 'none', borderTop: '1px solid var(--color-border-subtle)', margin: 0 }} />
              <div>
                <div className="input-label">Important Features</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {selected.important_features?.length ? selected.important_features.map((f) => (
                    <span key={f} className="badge badge-medium" style={{ fontSize: 10 }}>{f}</span>
                  )) : <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>None selected</span>}
                </div>
              </div>
              <div>
                <div className="input-label">Wanted Features</div>
                <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {selected.wanted_features || '—'}
                </div>
              </div>
              {selected.additional_feedback && (
                <div>
                  <div className="input-label">Additional Feedback</div>
                  <div style={{ fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {selected.additional_feedback}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-card__footer">
              <button className="btn btn-secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
