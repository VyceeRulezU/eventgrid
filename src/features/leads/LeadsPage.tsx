import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Users, Mail, Phone, Calendar, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { SearchBar } from '@/components/shared/SearchBar'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Tabs } from '@/components/ui/Tabs'
import { useSearch } from '@/hooks/useSearch'
import { PageHero } from '@/components/shared/PageHero'
import { CalendarModal } from '@/components/ui/CalendarModal'
import styles from './LeadsPage.module.css'
import type { Lead } from '@/types'

const STATUSES = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiating', 'converted', 'lost'] as const
const SOURCES = ['referral', 'website', 'social', 'walk_in', 'email', 'call', 'other'] as const
const EVENT_TYPES = ['Wedding', 'Corporate Event', 'Birthday', 'Naming Ceremony', 'Anniversary', 'Graduation', 'Private Party', 'Conference', 'Other']

const statusColors: Record<string, string> = {
  new: 'var(--color-info)',
  contacted: 'var(--color-accent)',
  qualified: 'var(--color-success)',
  proposal_sent: '#8B5CF6',
  negotiating: '#F59E0B',
  converted: 'var(--color-success)',
  lost: 'var(--color-text-muted)',
}

export function LeadsPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)

  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showPreferredDate, setShowPreferredDate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const { query, setQuery, filtered } = useSearch(leads, ['client_name', 'client_email', 'client_phone', 'notes', 'event_type'])

  const [form, setForm] = useState({
    clientName: '', clientEmail: '', clientPhone: '',
    source: 'other', notes: '', budgetRange: '',
    eventType: '', preferredDate: '', guestCountEstimate: 0,
  })

  useEffect(() => {
    if (!user) return
    loadLeads()
  }, [user])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase.from('leads')
      .select('*')
      .eq('org_id', profile?.org_id)
      .order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
    setLoading(false)
  }

  const filteredLeads = selectedStatus === 'all'
    ? filtered
    : filtered.filter(l => l.status === selectedStatus)

  const statusCounts = STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length
    return acc
  }, {})

  function resetForm() {
    setForm({ clientName: '', clientEmail: '', clientPhone: '', source: 'other', notes: '', budgetRange: '', eventType: '', preferredDate: '', guestCountEstimate: 0 })
  }

  async function handleSave() {
    if (!form.clientName) {
      showNotification({ variant: 'warning', title: 'Client name is required' })
      return
    }
    setSaving(true)
    const payload = {
      org_id: profile?.org_id, created_by: user!.id,
      client_name: form.clientName, client_email: form.clientEmail || null,
      client_phone: form.clientPhone || null, source: form.source,
      notes: form.notes || null, budget_range: form.budgetRange || null,
      event_type: form.eventType || null, preferred_date: form.preferredDate || null,
      guest_count_estimate: form.guestCountEstimate || null,
    }

    if (editingLead) {
      const { error } = await supabase.from('leads').update(payload).eq('id', editingLead.id)
      if (error) { showNotification({ variant: 'error', title: 'Update failed', message: error.message }); setSaving(false); return }
      setLeads(leads.map(l => l.id === editingLead.id ? { ...l, ...payload } as Lead : l))
      showNotification({ variant: 'success', title: 'Lead updated' })
    } else {
      const { data, error } = await supabase.from('leads').insert(payload).select().single()
      if (error) { showNotification({ variant: 'error', title: 'Save failed', message: error.message }); setSaving(false); return }
      setLeads([data as unknown as Lead, ...leads])
      showNotification({ variant: 'success', title: 'Lead created' })
    }
    setSaving(false)
    setShowForm(false)
    setEditingLead(null)
    resetForm()
  }

  function openEdit(lead: Lead) {
    setEditingLead(lead)
    setForm({
      clientName: lead.client_name, clientEmail: lead.client_email || '',
      clientPhone: lead.client_phone || '', source: lead.source,
      notes: lead.notes || '', budgetRange: lead.budget_range || '',
      eventType: lead.event_type || '', preferredDate: lead.preferred_date || '',
      guestCountEstimate: lead.guest_count_estimate || 0,
    })
    setShowForm(true)
  }

  function handleConvert(lead: Lead) {
    showModal({
      variant: 'confirm', title: 'Convert to Event?',
      message: `Create an event from ${lead.client_name}'s lead?`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        { label: 'Convert', variant: 'primary' as const, onClick: async () => {
          const { data: evt, error } = await supabase.from('events').insert({
            org_id: profile?.org_id, created_by: user!.id,
            name: `${lead.client_name}'s ${lead.event_type || 'Event'}`,
            event_type: lead.event_type || 'Other',
            event_date: lead.preferred_date || null,
            status: 'draft', payment_status: 'unpaid',
          }).select().single()
          if (error) { showNotification({ variant: 'error', title: 'Conversion failed', message: error.message }); return }
          await supabase.from('leads').update({ status: 'converted', converted_to_event_id: evt.id }).eq('id', lead.id)
          setLeads(leads.map(l => l.id === lead.id ? { ...l, status: 'converted' as Lead['status'], converted_to_event_id: evt.id } : l))
          showNotification({ variant: 'success', title: 'Converted!', message: 'Event created from lead' })
          navigate(`/events/${evt.id}`)
        }},
      ],
    })
  }

  function handleDelete(lead: Lead) {
    showModal({
      variant: 'confirm', title: 'Delete lead?',
      message: `Delete lead for ${lead.client_name}?`,
      actions: [
        { label: 'Cancel', variant: 'secondary' as const, onClick: () => {} },
        { label: 'Delete', variant: 'danger' as const, onClick: async () => {
          await supabase.from('leads').delete().eq('id', lead.id)
          setLeads(leads.filter(l => l.id !== lead.id))
          showNotification({ variant: 'success', title: 'Lead deleted' })
        }},
      ],
    })
  }

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 80, marginBottom: 16 }} /><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  return (
    <div>
      <PageHero icon={Users} title="Lead Management"
        actions={
          <div className={styles.pageHeroActions}>
            <SearchBar value={query} onChange={setQuery} placeholder="Search leads..." />
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingLead(null); resetForm(); setShowForm(true) }}>
              <Plus size={16} /> Add Lead
            </button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { key: 'all', label: `All (${leads.length})` },
          ...STATUSES.map(s => ({ key: s, label: `${s.replace('_', ' ')} (${statusCounts[s] || 0})` })),
        ]}
        activeTab={selectedStatus}
        onChange={setSelectedStatus}
      />

      {showForm && (
        <div className="overlay" onClick={() => { setShowForm(false); setEditingLead(null) }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">{editingLead ? 'Edit Lead' : 'New Lead'}</h3>
              <button className="modal-card-close" onClick={() => { setShowForm(false); setEditingLead(null) }}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="input-wrapper"><label className="input-label">Client Name *</label><input className="input" value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} /></div>
                <div className="input-wrapper"><label className="input-label">Phone</label><input className="input" type="tel" value={form.clientPhone} onChange={e => setForm({...form, clientPhone: e.target.value})} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Source</label>
                  <DropdownMenu
                    trigger={<span>{form.source.replace('_', ' ')}</span>}
                    items={SOURCES.map(s => ({ label: s.replace('_', ' '), value: s }))}
                    onSelect={(item) => setForm({...form, source: item.value})}
                  />
                </div>
                <div className="input-wrapper"><label className="input-label">Event Type</label>
                  <DropdownMenu
                    trigger={<span>{form.eventType || 'Select...'}</span>}
                    items={EVENT_TYPES.map(t => ({ label: t, value: t }))}
                    onSelect={(item) => setForm({...form, eventType: item.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="input-wrapper"><label className="input-label">Budget Range</label><input className="input" value={form.budgetRange} onChange={e => setForm({...form, budgetRange: e.target.value})} placeholder="e.g. ₦500K-1M" /></div>
                <div className="input-wrapper"><label className="input-label">Preferred Date</label>
                  <button className="input" type="button" onClick={() => setShowPreferredDate(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} /> {form.preferredDate ? new Date(form.preferredDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
                  </button>
                  <CalendarModal open={showPreferredDate} value={form.preferredDate} onChange={d => { setForm({...form, preferredDate: d}); setShowPreferredDate(false) }} onClose={() => setShowPreferredDate(false)} />
                </div>
              </div>
              <div className="input-wrapper"><label className="input-label">Guest Count</label><input className="input" type="number" value={form.guestCountEstimate} onChange={e => setForm({...form, guestCountEstimate: Number(e.target.value)})} /></div>
              <div className="input-wrapper"><label className="input-label">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditingLead(null) }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : editingLead ? 'Update' : 'Save Lead'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredLeads.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px 24px' }}>
            <div className="empty-state__title">No leads found</div>
            <div className="empty-state__description">Add your first lead to start tracking prospects</div>
            <button className="btn btn-primary" onClick={() => { setEditingLead(null); resetForm(); setShowForm(true) }}><Plus size={16} /> Add Lead</button>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Event</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ width: 80 }} />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id}>
                    <td><span className={styles.clientName}>{lead.client_name}</span></td>
                    <td>
                      <div className={styles.contactInfo}>
                        {lead.client_email && <span><Mail size={12} />{lead.client_email}</span>}
                        {lead.client_phone && <span><Phone size={12} />{lead.client_phone}</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 'var(--text-sm)' }}>
                        {lead.event_type && <div>{lead.event_type}</div>}
                        {lead.preferred_date && <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                          <Calendar size={11} /> {new Date(lead.preferred_date).toLocaleDateString()}
                        </div>}
                      </div>
                    </td>
                    <td><span className={styles.sourceBadge}>{lead.source.replace('_', ' ')}</span></td>
                    <td>
                      <span className={styles.statusDot} style={{ background: statusColors[lead.status] }} />
                      <span style={{ fontSize: 'var(--text-sm)', textTransform: 'capitalize' }}>{lead.status.replace('_', ' ')}</span>
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {lead.status !== 'converted' && lead.status !== 'lost' && (
                          <button className="btn btn-ghost btn-icon btn-xs" onClick={() => handleConvert(lead)} title="Convert to event"><Calendar size={14} /></button>
                        )}
                        <button className="btn btn-ghost btn-icon btn-xs" onClick={() => openEdit(lead)} title="Edit"><Pencil size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-xs" onClick={() => handleDelete(lead)} title="Delete"><X size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
