import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, X, FileSignature, Send, CheckCircle, XCircle, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs } from '@/components/ui/Tabs'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import styles from './ProposalsPage.module.css'
import type { Proposal, ProposalSection } from '@/types'

const STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'] as const
const statusColors: Record<string, string> = {
  draft: 'var(--color-text-muted)', sent: 'var(--color-accent)', viewed: '#8B5CF6',
  accepted: 'var(--color-success)', rejected: 'var(--color-error)', expired: 'var(--color-text-muted)',
}

function fmtMoney(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG')
}

export function ProposalsPage() {
  const { id: paramId } = useParams<{ id: string }>()
  const eventId = useResolvedEventId().eventId
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showNotification = useUIStore((s) => s.showNotification)

  const isEventMode = !!paramId
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showValidUntil, setShowValidUntil] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const [form, setForm] = useState({
    title: '', description: '', validUntil: '', clientEmail: '',
    sections: [] as ProposalSection[], totalAmount: 0,
  })
  const [sectionForm, setSectionForm] = useState({ title: '', description: '', amount: 0 })

  useEffect(() => {
    loadProposals()
  }, [eventId])

  async function loadProposals() {
    setLoading(true)
    let query = supabase.from('proposals').select('*').order('created_at', { ascending: false })
    if (isEventMode && eventId) {
      query = query.eq('event_id', eventId)
      const { data: evt } = await supabase.from('events').select('name').eq('id', eventId).single()
      if (evt) setEventName(evt.name)
    } else {
      query = query.eq('created_by', user!.id)
    }
    const { data } = await query
    if (data) setProposals(data as Proposal[])
    setLoading(false)
  }

  const filtered = activeTab === 'all' ? proposals : proposals.filter(p => p.status === activeTab)

  function addSection() {
    if (!sectionForm.title) return
    setForm(f => ({
      ...f,
      sections: [...f.sections, { ...sectionForm, amount: Math.round(sectionForm.amount * 100) }],
      totalAmount: f.totalAmount + Math.round(sectionForm.amount * 100),
    }))
    setSectionForm({ title: '', description: '', amount: 0 })
  }

  function removeSection(idx: number) {
    setForm(f => ({
      ...f,
      sections: f.sections.filter((_, i) => i !== idx),
      totalAmount: f.totalAmount - (f.sections[idx]?.amount || 0),
    }))
  }

  async function handleSave(status: 'draft' | 'sent') {
    if (!form.title) { showNotification({ variant: 'warning', title: 'Title is required' }); return }
    setSaving(true)
    const payload = {
      org_id: profile?.org_id, created_by: user!.id,
      event_id: isEventMode ? eventId : null,
      title: form.title, description: form.description || null,
      valid_until: form.validUntil || null,
      status, sections: form.sections, total_amount: form.totalAmount,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
    }
    const { data, error } = await supabase.from('proposals').insert(payload).select().single()
    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      setSaving(false)
      return
    }
    setProposals([data as unknown as Proposal, ...proposals])
    setShowForm(false)
    setSaving(false)
    showNotification({ variant: 'success', title: status === 'sent' ? 'Proposal sent!' : 'Proposal saved' })
    setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 })
  }

  async function updateStatus(proposal: Proposal, status: string) {
    const updates: Partial<Proposal> = { status: status as Proposal['status'] }
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    const { error } = await supabase.from('proposals').update(updates).eq('id', proposal.id)
    if (error) { showNotification({ variant: 'error', title: 'Update failed', message: error.message }); return }
    setProposals(proposals.map(p => p.id === proposal.id ? { ...p, ...updates } as Proposal : p))
    showNotification({ variant: 'success', title: `Proposal ${status}` })
  }

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  return (
    <div>
      <PageHero icon={FileSignature} title={`Proposals & Quotes${isEventMode && eventName ? ` | ${eventName}` : ''}`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <Plus size={16} /> New Proposal
          </button>
        }
      />

      <Tabs
        tabs={[
          { key: 'all', label: `All (${proposals.length})` },
          ...STATUSES.map(s => ({ key: s, label: s.replace('_', ' ') })),
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Proposal</h3>
              <button className="modal-card-close" onClick={() => { setShowForm(false); setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 }) }}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-wrapper"><label className="input-label">Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Wedding Planning Proposal" /></div>
              <div className="input-wrapper"><label className="input-label">Description</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Valid Until</label>
                  <button className="input" type="button" onClick={() => setShowValidUntil(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} /> {form.validUntil ? new Date(form.validUntil + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
                  </button>
                  <CalendarModal open={showValidUntil} value={form.validUntil} onChange={d => { setForm({...form, validUntil: d}); setShowValidUntil(false) }} onClose={() => setShowValidUntil(false)} />
                </div>
                <div className="input-wrapper"><label className="input-label">Client Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@example.com" /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 12 }}>
                <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>Sections / Line Items</label>
                <div className={styles.sectionContainer}>
                  {form.sections.length === 0 && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textAlign: 'center', padding: 16 }}>No items yet — add your first section below</div>
                  )}
                  {form.sections.map((s, i) => (
                    <div key={i} className={styles.sectionRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: 'var(--text-sm)' }}>{s.title}</strong>
                        {s.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.description}</div>}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', whiteSpace: 'nowrap' }}>{fmtMoney(s.amount ?? 0)}</div>
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removeSection(i)}><X size={14} /></button>
                    </div>
                  ))}
                </div>
                <div className={styles.addSection}>
                  <input className="input" placeholder="Section title" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} style={{ flex: 1 }} />
                  <input className="input" placeholder="Summary" value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} style={{ flex: 1 }} />
                  <input className="input" type="number" placeholder="₦ amount" value={sectionForm.amount || ''} onChange={e => setSectionForm({...sectionForm, amount: Number(e.target.value)})} style={{ width: 100 }} />
                  <button className="btn btn-secondary btn-sm" onClick={addSection}>Add</button>
                </div>
                {form.totalAmount > 0 && <div className={styles.totalRow}>Total: {fmtMoney(form.totalAmount)}</div>}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border-subtle)' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</button>
                <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={saving}>
                  <Send size={14} /> {saving ? 'Saving...' : 'Send Proposal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">No proposals yet</div>
            <div className="empty-state__description">Create your first proposal to send to clients</div>
          </div>
        ) : filtered.map(p => (
          <div key={p.id} className="card" style={{ padding: 'var(--space-4) var(--space-5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{p.title}</span>
                  <span className={styles.statusBadge} style={{ background: `${statusColors[p.status]}20`, color: statusColors[p.status] }}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                {p.description && <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>{p.description}</p>}
                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                  <span>{fmtMoney(p.total_amount)}</span>
                  {p.valid_until && <span>Valid until {new Date(p.valid_until).toLocaleDateString()}</span>}
                  <span>{p.sections?.length || 0} items</span>
                  <span>{new Date(p.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {p.status === 'draft' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(p, 'sent')}><Send size={14} /> Send</button>
                )}
                {(p.status === 'sent' || p.status === 'viewed') && (
                  <>
                    <button className="btn btn-success btn-sm" onClick={() => updateStatus(p, 'accepted')}><CheckCircle size={14} /> Accept</button>
                    <button className="btn btn-danger btn-sm" onClick={() => updateStatus(p, 'rejected')}><XCircle size={14} /> Reject</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
