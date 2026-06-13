import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth.store'
import { ClipboardList, Eye, X } from 'lucide-react'
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

export function AdminSurveyResponsesPage() {
  const role = useAuthStore((s) => s.role)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<SurveyResponse | null>(null)

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
