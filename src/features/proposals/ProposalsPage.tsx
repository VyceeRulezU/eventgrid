import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, X, FileSignature, Send, CheckCircle, XCircle, Calendar, Copy, Trash2, Download, Mail, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs } from '@/components/ui/Tabs'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import {
  exportProposalToExcel,
  exportProposalToPDF,
  generateExcelBase64,
  generatePDFDocument
} from './ProposalExport'
import styles from './ProposalsPage.module.css'
import type { Proposal } from '@/types'

const DEFAULT_CATEGORIES = [
  'Venue & Facility', 'Catering', 'Decor & Design', 'Audio/Visual',
  'Photography', 'Videography', 'Transportation', 'Fashion & Beauty',
  'Entertainment', 'Stationery', 'Security', 'Other',
]

const statusColors: Record<string, string> = {
  draft: 'var(--color-text-muted)',
  sent: 'var(--color-accent)',
  viewed: '#8B5CF6',
  accepted: 'var(--color-success)',
  rejected: 'var(--color-error)',
  expired: 'var(--color-text-muted)',
}

interface ProposalSection {
  category: string
  title: string
  description: string
  amount: number // in kobo
}

function fmtMoney(kobo: number) {
  return '₦' + (kobo / 100).toLocaleString('en-NG')
}

function getCategorySublabel(category: string): string {
  const c = category.toLowerCase()
  if (c.includes('venue') || c.includes('facility')) return 'Rentals, halls & logistics'
  if (c.includes('catering') || c.includes('food')) return 'Food, drinks & server staffing'
  if (c.includes('decor') || c.includes('design')) return 'Florals, stage & lighting theme'
  if (c.includes('audio') || c.includes('visual')) return 'Speakers, screens & microphones'
  if (c.includes('photo')) return 'Event shoots & digital album'
  if (c.includes('video')) return 'Cinematic video & highlight reels'
  if (c.includes('transport')) return 'Guest shuttle & crew transfer'
  if (c.includes('fashion') || c.includes('beauty')) return 'Gown, suit, makeup & styling'
  if (c.includes('entertain')) return 'Live band, DJ, MC performance'
  if (c.includes('stationery')) return 'Prints, menu cards & invites'
  if (c.includes('security')) return 'Bouncers, gate control & patrol'
  return 'Proposed service cost'
}

export function ProposalsPage() {
  const { id: paramId } = useParams<{ id: string }>()
  const { eventId, isReadOnly } = useResolvedEventId()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const showNotification = useUIStore((s) => s.showNotification)
  const showModal = useUIStore((s) => s.showModal)
  const navigate = useNavigate()

  const isEventMode = !!paramId
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [eventName, setEventName] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showValidUntil, setShowValidUntil] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('draft')
  const [activeProposalId, setActiveProposalId] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', validUntil: '', clientEmail: '',
    sections: [] as ProposalSection[], totalAmount: 0,
  })
  const [sectionForm, setSectionForm] = useState({ category: 'Other', title: '', description: '', amount: 0 })

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
    if (data) {
      const typed = data as Proposal[]
      setProposals(typed)
      // Pick first active proposal of current active tab status
      const matchStatus = activeTab === 'approved' ? ['accepted', 'approved'] : [activeTab]
      const matching = typed.filter(p => matchStatus.includes(p.status))
      if (matching.length > 0) setActiveProposalId(matching[0].id)
      else if (typed.length > 0) setActiveProposalId(typed[0].id)
      else setActiveProposalId(null)
    }
    setLoading(false)
  }

  // Tabs record those which are sent, drafts, and approved
  const filtered = proposals.filter(p => {
    if (activeTab === 'draft') return p.status === 'draft'
    if (activeTab === 'sent') return p.status === 'sent' || p.status === 'viewed'
    if (activeTab === 'approved') return p.status === 'accepted' || p.status === 'rejected' || p.status === 'expired'
    return true
  })

  const activeProposal = proposals.find(p => p.id === activeProposalId) || null
  const activeSections = activeProposal?.sections as unknown as ProposalSection[] || []

  // Group by category to replica financials
  const groupedSections = DEFAULT_CATEGORIES.map(cat => {
    const matching = activeSections.filter(s => (s.category || 'Other').toLowerCase() === cat.toLowerCase())
    const totalAmount = matching.reduce((sum, s) => sum + s.amount, 0)
    const combinedDesc = matching.map(s => s.description || s.title || '').filter(Boolean).join('; ')
    return {
      category: cat,
      description: combinedDesc,
      amount: totalAmount,
    }
  }).filter(g => g.amount > 0)

  function addSection() {
    if (!sectionForm.title) return
    const amountInKobo = Math.round(sectionForm.amount * 100)
    setForm(f => ({
      ...f,
      sections: [...f.sections, { ...sectionForm, amount: amountInKobo } as ProposalSection],
      totalAmount: f.totalAmount + amountInKobo,
    }))
    setSectionForm({ category: 'Other', title: '', description: '', amount: 0 })
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
      client_email: form.clientEmail || null,
    }
    const { data, error } = await supabase.from('proposals').insert(payload).select().single()
    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      setSaving(false)
      return
    }
    setProposals([data as unknown as Proposal, ...proposals])
    setActiveProposalId(data.id)
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
    showNotification({ variant: 'success', title: `Proposal status updated to ${status}` })
  }

  async function convertToEvent(proposal: Proposal) {
    showModal({
      variant: 'confirm',
      title: 'Convert Quote to Event?',
      message: `Create a live event from "${proposal.title}" proposal?`,
      actions: [
        { label: 'Cancel', variant: 'secondary', onClick: () => {} },
        { label: 'Convert & Approve', variant: 'primary', onClick: async () => {
          setSaving(true)
          const { data: evt, error } = await supabase.from('events').insert({
            org_id: profile?.org_id,
            created_by: user!.id,
            name: proposal.title,
            event_type: 'Other',
            event_date: proposal.valid_until || null,
            status: 'draft',
            payment_status: 'unpaid',
          }).select().single()
          
          if (error) {
            showNotification({ variant: 'error', title: 'Event conversion failed', message: error.message })
            setSaving(false)
            return
          }

          // Link proposal to event and mark accepted
          await supabase.from('proposals').update({
            status: 'accepted',
            event_id: evt.id,
            responded_at: new Date().toISOString()
          }).eq('id', proposal.id)

          // Copy sections into event budget allocations to sync seamlessly
          const budgetAllocations = proposal.sections.map(s => ({
            event_id: evt.id,
            category: s.category || 'Other',
            allocated: s.amount || 0,
          }))

          if (budgetAllocations.length > 0) {
            await supabase.from('budget_allocations').insert(budgetAllocations)
          }

          showNotification({ variant: 'success', title: 'Converted successfully!', message: `Created live event "${proposal.title}"` })
          setSaving(false)
          navigate(`/events/${evt.id}`)
        }}
      ]
    })
  }

  async function deleteProposal(id: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this proposal?")
    if (!confirmDelete) return
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    if (error) { showNotification({ variant: 'error', title: 'Failed to delete', message: error.message }); return }
    const remaining = proposals.filter(p => p.id !== id)
    setProposals(remaining)
    if (remaining.length > 0) setActiveProposalId(remaining[0].id)
    else setActiveProposalId(null)
    showNotification({ variant: 'success', title: 'Proposal deleted' })
  }

  function handleCopyLink() {
    if (!activeProposal) return
    const shareUrl = `${window.location.origin}/proposal/${activeProposal.id}`
    navigator.clipboard.writeText(shareUrl)
    showNotification({ variant: 'success', title: 'Link copied', message: 'Client proposal URL copied to clipboard!' })
  }

  async function handleEmailClient(format: 'pdf' | 'excel') {
    if (!activeProposal) return
    if (!activeProposal.client_email) {
      showNotification({ variant: 'warning', title: 'Missing Client Email', message: 'Please specify a client email in the proposal before sending.' })
      return
    }
    setSendingEmail(true)
    try {
      let base64Content = ''
      let filename = ''
      
      if (format === 'pdf') {
        const doc = generatePDFDocument(groupedSections, activeProposal.title, activeProposal.total_amount, activeProposal.description || '')
        const rawString = doc.output('datauristring')
        base64Content = rawString.split(',')[1]
        filename = `${activeProposal.title.replace(/\s+/g, '_')}_Quote.pdf`
      } else {
        base64Content = generateExcelBase64(groupedSections, activeProposal.total_amount)
        filename = `${activeProposal.title.replace(/\s+/g, '_')}_Quote.xlsx`
      }

      // Fetch supabase auth token to call Deno function
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-automated-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          template_name: 'Congratulations - Event Created', // placeholder template trigger
          to: { email: activeProposal.client_email, name: 'Valued Client' },
          variables: {
            subject: `Proposal from NaliGrid: ${activeProposal.title}`,
            body_html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.6;">
                <h2 style="color: #1a2432; border-bottom: 2px solid #D4A017; padding-bottom: 8px;">NaliGrid Proposal</h2>
                <p>Hello,</p>
                <p>We have compiled the proposed budget categories and service costs for <strong>${activeProposal.title}</strong>.</p>
                <p>Please find the official proposal document spreadsheet/pdf attached directly to this email.</p>
                <div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
                  <strong>Total Proposed Budget:</strong> ${fmtMoney(activeProposal.total_amount)}
                </div>
                <p>Reply to this email if you have any feedback or would like to approve this estimate.</p>
                <br/>
                <p>Sincerely,<br/><strong>NaliGrid Event Services</strong></p>
              </div>
            `
          },
          attachment: {
            content: base64Content,
            name: filename
          }
        })
      })

      if (!res.ok) {
        const bodyText = await res.text()
        throw new Error(bodyText || `Server returned status ${res.status}`)
      }

      showNotification({ variant: 'success', title: 'Email Sent!', message: `Sent proposal to ${activeProposal.client_email} via Brevo SMTP.` })
      
      // Update status to 'sent' if it was a draft
      if (activeProposal.status === 'draft') {
        await updateStatus(activeProposal, 'sent')
      }
    } catch (err) {
      showNotification({ variant: 'error', title: 'Failed to send email', message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSendingEmail(false)
    }
  }

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

  if (proposals.length === 0 && !showForm) {
    return (
      <div>
        <PageHero icon={FileSignature} title={`Proposals & Quotes${isEventMode && eventName ? ` | ${eventName}` : ''}`}
          actions={
            !isReadOnly && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                <Plus size={16} /> New Proposal
              </button>
            )
          }
        />
        <div className="empty-state">
          <div className="empty-state__title">No proposals yet</div>
          <div className="empty-state__description">
            {isReadOnly ? 'This event is archived and has no proposals.' : 'Create your first proposal to send to clients.'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHero icon={FileSignature} title={`Proposals & Quotes${isEventMode && eventName ? ` | ${eventName}` : ''}`}
        actions={
          !isReadOnly && (
            <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              <Plus size={16} /> New Proposal
            </button>
          )
        }
      />

      <Tabs
        tabs={[
          { key: 'draft', label: `Drafts` },
          { key: 'sent', label: `Sent & Pending` },
          { key: 'approved', label: `Approved & Decisions` },
        ]}
        activeTab={activeTab}
        onChange={(k) => {
          setActiveTab(k)
          const matchStatus = k === 'approved' ? ['accepted', 'rejected', 'expired'] : k === 'sent' ? ['sent', 'viewed'] : ['draft']
          const matching = proposals.filter(p => matchStatus.includes(p.status))
          if (matching.length > 0) setActiveProposalId(matching[0].id)
          else setActiveProposalId(null)
        }}
      />

      {showForm && (
        <div className="overlay" onClick={() => setShowForm(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">New Proposal Quote</h3>
              <button className="modal-card-close" onClick={() => { setShowForm(false); setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 }) }}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-wrapper"><label className="input-label">Proposal Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. 500-Guest Corporate Gala Quote" /></div>
              <div className="input-wrapper"><label className="input-label">Description / Scope of Work</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="General details about services to be offered..." /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="input-wrapper"><label className="input-label">Valid Until</label>
                  <button className="input" type="button" onClick={() => setShowValidUntil(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
                    <Calendar size={14} /> {form.validUntil ? new Date(form.validUntil + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
                  </button>
                  <CalendarModal open={showValidUntil} value={form.validUntil} onChange={d => { setForm({...form, validUntil: d}); setShowValidUntil(false) }} onClose={() => setShowValidUntil(false)} />
                </div>
                <div className="input-wrapper"><label className="input-label">Client Recipient Email</label><input className="input" type="email" value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@example.com" /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                <label className="input-label" style={{ marginBottom: 12, display: 'block', fontWeight: 600 }}>Proposed Items & Event Categories</label>
                
                <div className={styles.formSectionsList}>
                  {form.sections.length === 0 && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>No line items added yet — configure budget categories below</div>
                  )}
                  {form.sections.map((s, i) => (
                    <div key={i} className={styles.sectionRowItem}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span className={styles.sectionCategoryTag}>{s.category}</span>
                        <strong style={{ fontSize: 'var(--text-sm)', display: 'block', color: 'var(--color-text-primary)', marginTop: 2 }}>{s.title}</strong>
                        {s.description && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{s.description}</div>}
                      </div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)', marginRight: 8 }}>{fmtMoney(s.amount ?? 0)}</div>
                      <button className="btn btn-ghost btn-icon btn-xs" onClick={() => removeSection(i)} style={{ color: 'var(--color-error)' }}><X size={14} /></button>
                    </div>
                  ))}
                </div>

                <div className={styles.addSectionWrapper}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: '100%', marginBottom: 8 }}>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Budget Category</label>
                      <DropdownMenu
                        trigger={<span className={styles.categoryDropdownTrigger}>{sectionForm.category}</span>}
                        items={DEFAULT_CATEGORIES.map(c => ({ label: c, value: c }))}
                        onSelect={(item) => setSectionForm({...sectionForm, category: item.value})}
                      />
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Specification / Title</label>
                      <input className="input" placeholder="e.g. Standard Sound System" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} style={{ height: 36 }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                    <input className="input" placeholder="Deliverables description..." value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} style={{ flex: 1, height: 36 }} />
                    <input className="input" type="number" placeholder="Price (₦)" value={sectionForm.amount || ''} onChange={e => setSectionForm({...sectionForm, amount: Number(e.target.value)})} style={{ width: 110, height: 36 }} />
                    <button className="btn btn-secondary btn-sm" onClick={addSection} disabled={!sectionForm.title || sectionForm.amount <= 0} style={{ height: 36 }}>Add Item</button>
                  </div>
                </div>
                {form.totalAmount > 0 && <div className={styles.formTotalsRow}><strong>Grand Total Proposed: {fmtMoney(form.totalAmount)}</strong></div>}
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</button>
                <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={saving}><Send size={14} /> {saving ? 'Sending...' : 'Send Quote'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.workspace}>
        {/* Left column: proposals list */}
        <div className={styles.sidebar}>
          {filtered.length === 0 ? (
            <div className={styles.emptySidebar}>No quotes in this tab</div>
          ) : (
            <div className={styles.proposalsList}>
              {filtered.map(p => {
                const isSelected = p.id === activeProposalId
                return (
                  <div
                    key={p.id}
                    className={`${styles.proposalCard} ${isSelected ? styles.selectedCard : ''}`}
                    onClick={() => setActiveProposalId(p.id)}
                  >
                    <div className={styles.proposalCardHeader}>
                      <span className={styles.proposalTitleText}>{p.title}</span>
                      <span className={styles.statusBadge} style={{ background: `${statusColors[p.status] || 'var(--color-accent)'}15`, color: statusColors[p.status] || 'var(--color-accent)' }}>
                        {p.status}
                      </span>
                    </div>
                    <div className={styles.proposalClientEmail}>{p.client_email || 'No client email'}</div>
                    <div className={styles.proposalMeta}>
                      <span>{fmtMoney(p.total_amount)}</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column: proposal details sheet preview */}
        <div className={styles.previewPane}>
          {activeProposal ? (
            <div className={styles.previewContent}>
              <div className={styles.previewActionBar}>
                <h4 style={{ margin: 0, fontWeight: 600 }}>{activeProposal.title}</h4>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  
                  {/* Export Options Dropdown */}
                  <DropdownMenu
                    trigger={<><Download size={13} /> Export Documents</>}
                    className={styles.exportDropdown}
                    items={[
                      { label: 'Download as Excel', value: 'excel' },
                      { label: 'Download as PDF', value: 'pdf' },
                    ]}
                    onSelect={(item) => {
                      if (item.value === 'excel') exportProposalToExcel(groupedSections, activeProposal.title, activeProposal.total_amount)
                      else exportProposalToPDF(groupedSections, activeProposal.title, activeProposal.total_amount, activeProposal.description || '')
                    }}
                  />

                  {/* Direct Email Options Dropdown */}
                  <DropdownMenu
                    trigger={
                      <button className="btn btn-secondary btn-sm" disabled={sendingEmail} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {sendingEmail ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />} Email Client
                      </button>
                    }
                    className={styles.exportDropdown}
                    items={[
                      { label: 'Email PDF Document', value: 'email_pdf' },
                      { label: 'Email Excel Sheet', value: 'email_excel' },
                    ]}
                    onSelect={(item) => {
                      if (item.value === 'email_pdf') handleEmailClient('pdf')
                      else handleEmailClient('excel')
                    }}
                  />

                  {/* Copy Link trigger */}
                  <button className="btn btn-secondary btn-sm" onClick={handleCopyLink} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Copy size={13} /> Copy link
                  </button>

                  {!isReadOnly && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      {/* Approved & Convert triggers */}
                      {activeProposal.status === 'draft' && (
                        <button className="btn btn-primary btn-sm" onClick={() => updateStatus(activeProposal, 'sent')}><Send size={13} /> Send</button>
                      )}
                      
                      {(activeProposal.status === 'sent' || activeProposal.status === 'viewed') && (
                        <>
                          <button className="btn btn-success btn-sm" onClick={() => { updateStatus(activeProposal, 'accepted') }}><CheckCircle size={13} /> Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => updateStatus(activeProposal, 'rejected')}><XCircle size={13} /> Reject</button>
                        </>
                      )}

                      {/* Convert approved quote to event */}
                      {activeProposal.status === 'accepted' && (
                        <button className="btn btn-primary btn-sm" onClick={() => convertToEvent(activeProposal)}><RefreshCw size={13} /> Convert to Event</button>
                      )}

                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--color-error)' }} onClick={() => deleteProposal(activeProposal.id)} title="Delete Proposal">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Proposal Sheet document */}
              <div className={styles.proposalSheet}>
                <div className={styles.proposalDocHeader}>
                  <div>
                    <h2 className={styles.brandTitle}>NaliGrid</h2>
                    <span className={styles.brandSub}>Client Quote & Cost Estimates</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.proposalDocStatus} style={{ borderColor: statusColors[activeProposal.status] || 'var(--color-accent)', color: statusColors[activeProposal.status] || 'var(--color-accent)' }}>
                      {activeProposal.status}
                    </span>
                  </div>
                </div>

                <div className={styles.docMetadata}>
                  <div>
                    <span className={styles.metaLabel}>Client Recipient</span>
                    <strong className={styles.metaValue}>{activeProposal.client_email || 'No Client Email Specified'}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.metaLabel}>Valid Until</span>
                    <span className={styles.metaValue}>{activeProposal.valid_until ? new Date(activeProposal.valid_until).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {activeProposal.description && (
                  <div className={styles.docDescBlock}>
                    <p>{activeProposal.description}</p>
                  </div>
                )}

                {/* Replica of Budget & Category section in Financials */}
                <div className={styles.replicaSection}>
                  <h3 className={styles.replicaHeading}>Proposed Costs by Category</h3>
                  <div className={styles.tableScroll}>
                    <table className={styles.table}>
                      <thead className={styles.thead}>
                        <tr>
                          <th className={styles.th}>Category</th>
                          <th className={styles.th}>Status</th>
                          <th className={styles.th}>Progress (% of Total)</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>Proposed Quote</th>
                          <th className={styles.th} style={{ textAlign: 'right' }}>% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedSections.map((row) => {
                          const pctOfTotal = activeProposal.total_amount > 0 ? (row.amount / activeProposal.total_amount) * 100 : 0
                          return (
                            <tr key={row.category} className={styles.tr}>
                              <td className={styles.td}>
                                <div className={styles.categoryCell}>
                                  <div className={styles.categoryText}>
                                    <div className={styles.categoryName}>{row.category}</div>
                                    <div className={styles.categorySub}>{getCategorySublabel(row.category)}</div>
                                  </div>
                                </div>
                              </td>
                              <td className={styles.td}>
                                <span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>
                                  Proposed
                                </span>
                              </td>
                              <td className={styles.td}>
                                <div className={styles.progressContainer}>
                                  <div className={styles.progressBarBg}>
                                    <div 
                                      className={styles.progressBarFill} 
                                      style={{ width: `${Math.min(pctOfTotal, 100)}%`, backgroundColor: 'var(--color-accent)' }} 
                                    />
                                  </div>
                                  <span className={styles.progressPct}>
                                    {Math.round(pctOfTotal)}%
                                  </span>
                                </div>
                              </td>
                              <td className={styles.td} style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                {fmtMoney(row.amount)}
                              </td>
                              <td className={styles.td} style={{ textAlign: 'right', color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
                                {pctOfTotal.toFixed(1)}%
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className={styles.totalsSummaryRow}>
                    <span>Grand Total proposed:</span>
                    <strong>{fmtMoney(activeProposal.total_amount)}</strong>
                  </div>
                </div>

                {/* Breakdown Spec list below the category table */}
                <div className={styles.breakdownSection}>
                  <h4 className={styles.breakdownHeading}>Detailed Specifications & Deliverables</h4>
                  <div className={styles.breakdownList}>
                    {activeSections.map((s, idx) => (
                      <div key={idx} className={styles.breakdownItem}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className={styles.breakdownCategory}>{s.category}</span>
                          <strong className={styles.breakdownItemTitle}>{s.title || 'Specification'}</strong>
                          {s.description && <p className={styles.breakdownItemDesc}>{s.description}</p>}
                        </div>
                        <span className={styles.breakdownItemAmount}>{fmtMoney(s.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.emptyPreview}>
              <FileSignature size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }} />
              <h3>No Quote Selected</h3>
              <p>Select a quote from the left to view category budgets, export documents, or email estimate specifications directly to clients.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
