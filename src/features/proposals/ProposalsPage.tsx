import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, X, FileSignature, Send, Calendar, Trash2, Download, Mail, RefreshCw, Pencil } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { PageHero } from '@/components/shared/PageHero'
import { Tabs } from '@/components/ui/Tabs'
import { Table } from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { CalendarModal } from '@/components/ui/CalendarModal'
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
  amount: number
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
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null)
  const [showEditValidUntil, setShowEditValidUntil] = useState(false)

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
    if (data) setProposals(data as Proposal[])
    setLoading(false)
  }

  const filtered = proposals.filter(p => {
    if (activeTab === 'draft') return p.status === 'draft'
    if (activeTab === 'sent') return p.status === 'sent' || p.status === 'viewed'
    if (activeTab === 'approved') return p.status === 'accepted' || p.status === 'rejected' || p.status === 'expired'
    return true
  })

  function groupedSectionsFor(proposal: Proposal) {
    const sections = proposal.sections as unknown as ProposalSection[] || []
    return DEFAULT_CATEGORIES.map(cat => {
      const matching = sections.filter(s => (s.category || 'Other').toLowerCase() === cat.toLowerCase())
      const totalAmount = matching.reduce((sum, s) => sum + s.amount, 0)
      const combinedDesc = matching.map(s => s.description || s.title || '').filter(Boolean).join('; ')
      return { category: cat, description: combinedDesc, amount: totalAmount }
    }).filter(g => g.amount > 0)
  }

  function activeSectionsFor(proposal: Proposal) {
    return proposal.sections as unknown as ProposalSection[] || []
  }

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
    const newProposal = data as unknown as Proposal
    setProposals([newProposal, ...proposals])
    setShowForm(false)
    setSaving(false)
    if (status === 'sent') {
      setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 })
      await sendProposalEmail(newProposal, 'pdf')
    } else {
      showNotification({ variant: 'success', title: 'Proposal saved' })
      setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 })
    }
  }

  async function handleEditSave() {
    if (!editingProposal) return
    if (!form.title) { showNotification({ variant: 'warning', title: 'Title is required' }); return }
    setSaving(true)
    const { error } = await supabase.from('proposals').update({
      title: form.title,
      description: form.description || null,
      valid_until: form.validUntil || null,
      sections: form.sections,
      total_amount: form.totalAmount,
      client_email: form.clientEmail || null,
    }).eq('id', editingProposal.id)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed', message: error.message })
      setSaving(false)
      return
    }
    setProposals(proposals.map(p => p.id === editingProposal.id ? {
      ...p,
      title: form.title,
      description: form.description || null,
      valid_until: form.validUntil || null,
      sections: form.sections,
      total_amount: form.totalAmount,
      client_email: form.clientEmail || null,
    } as Proposal : p))
    setEditingProposal(null)
    setSaving(false)
    showNotification({ variant: 'success', title: 'Proposal updated' })
  }

  function openEdit(proposal: Proposal) {
    const sections = (proposal.sections as ProposalSection[]) || []
    setForm({
      title: proposal.title,
      description: proposal.description || '',
      validUntil: proposal.valid_until || '',
      clientEmail: proposal.client_email || '',
      sections,
      totalAmount: proposal.total_amount,
    })
    setEditingProposal(proposal)
  }

  function closeEdit() {
    setEditingProposal(null)
    setForm({ title: '', description: '', validUntil: '', clientEmail: '', sections: [], totalAmount: 0 })
  }

  async function updateStatus(proposal: Proposal, status: string) {
    const updates: Partial<Proposal> = { status: status as Proposal['status'] }
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    const { error } = await supabase.from('proposals').update(updates).eq('id', proposal.id)
    if (error) { showNotification({ variant: 'error', title: 'Update failed', message: error.message }); return }
    setProposals(proposals.map(p => p.id === proposal.id ? { ...p, ...updates } as Proposal : p))
    showNotification({ variant: 'success', title: `Proposal status updated to ${status}` })
    setPreviewProposal(null)
  }

  async function handleSend(proposal: Proposal) {
    if (!proposal.client_email) {
      showNotification({ variant: 'warning', title: 'Missing Client Email', message: 'Please set a client email first by editing the proposal.' })
      return
    }
    setPreviewProposal(proposal)
    await sendProposalEmail(proposal, 'pdf')
  }

  async function sendProposalEmail(proposal: Proposal, format: 'pdf' | 'excel') {
    if (!proposal.client_email) {
      showNotification({ variant: 'warning', title: 'Missing Client Email', message: 'Please specify a client email in the proposal before sending.' })
      return
    }
    setSendingEmail(true)
    const grouped = groupedSectionsFor(proposal)
    try {
      let base64Content = ''
      let filename = ''
      if (format === 'pdf') {
        const doc = generatePDFDocument(grouped, proposal.title, proposal.total_amount, proposal.description || '')
        const rawString = doc.output('datauristring')
        base64Content = rawString.split(',')[1]
        filename = `${proposal.title.replace(/\s+/g, '_')}_Quote.pdf`
      } else {
        base64Content = generateExcelBase64(grouped, proposal.total_amount)
        filename = `${proposal.title.replace(/\s+/g, '_')}_Quote.xlsx`
      }

      const budgetRowsHtml = grouped.map(r => `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;font-size:13px;color:#374151;">${r.category}</td>
          <td style="padding:8px 12px;font-size:13px;color:#6b7280;">${r.description || 'Proposed service'}</td>
          <td style="padding:8px 12px;font-size:13px;color:#111827;text-align:right;font-weight:600;">${fmtMoney(r.amount)}</td>
        </tr>
      `).join('')

      const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-automated-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          template_name: 'Proposal Delivery',
          to: { email: proposal.client_email, name: 'Valued Client' },
          variables: {
            '{{subject_content}}': `You've received a proposal from ${profile?.display_name || 'an event planner'} on NaliGrid`,
            '{{body_html_content}}': `
              <div style="font-family: Arial, sans-serif; max-width: 600px; color: #333; line-height: 1.6; margin: 0 auto;">
                <div style="background:#111827;padding:24px 32px;border-radius:8px 8px 0 0;">
                  <h1 style="color:#D4A017;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;">NaliGrid</h1>
                  <p style="color:#9CA3AF;margin:4px 0 0;font-size:12px;">Professional Event Management</p>
                </div>
                <div style="background:#fff;padding:32px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
                  <p style="font-size:15px;color:#111827;margin:0 0 20px;">Hello,</p>
                  <p style="font-size:14px;color:#374151;margin:0 0 8px;">You have received a proposal from <strong>${profile?.display_name || 'an event planner'}</strong> for:</p>
                  <h2 style="font-size:18px;color:#D4A017;margin:0 0 4px;">${proposal.title}</h2>
                  <p style="font-size:12px;color:#6b7280;margin:0 0 20px;">Issued ${now}${proposal.valid_until ? ' · Valid until ' + new Date(proposal.valid_until).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</p>

                  ${proposal.description ? `<div style="background:#f9fafb;border-left:3px solid #D4A017;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#374151;border-radius:0 4px 4px 0;">${proposal.description}</div>` : ''}

                  <h3 style="font-size:13px;color:#111827;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">Proposed Budget</h3>
                  <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
                    <thead>
                      <tr style="background:#f3f4f6;">
                        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:left;">Category</th>
                        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:left;">Description</th>
                        <th style="padding:8px 12px;font-size:11px;color:#6b7280;text-transform:uppercase;text-align:right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>${budgetRowsHtml}</tbody>
                    <tfoot>
                      <tr style="border-top:2px solid #D4A017;">
                        <td style="padding:8px 12px;font-weight:700;font-size:13px;color:#111827;" colspan="2">Grand Total</td>
                        <td style="padding:8px 12px;font-weight:800;font-size:15px;color:#D4A017;text-align:right;">${fmtMoney(proposal.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:24px 0;text-align:center;">
                    <p style="font-size:13px;color:#374151;margin:0 0 8px;">The detailed proposal document is also attached to this email.</p>
                    <a href="https://naligrid.com/register" style="color:#D4A017;font-size:13px;font-weight:600;text-decoration:none;">Register for free on NaliGrid →</a>
                    <p style="font-size:11px;color:#9CA3AF;margin:8px 0 0;">NaliGrid helps event planners manage budgets, vendors, tasks, and client communication — all in one place.</p>
                  </div>

                  <p style="font-size:12px;color:#6b7280;margin:0;">If you have any questions or would like to discuss this proposal, reply to this email.</p>
                  <p style="font-size:12px;color:#6b7280;margin:12px 0 0;">Best regards,<br/><strong style="color:#D4A017;">NaliGrid Team</strong></p>
                </div>
                <div style="text-align:center;padding:16px 32px;font-size:11px;color:#9CA3AF;">
                  NaliTech Consults Limited · Lagos, Nigeria<br/>
                  <a href="https://naligrid.com" style="color:#D4A017;text-decoration:none;">naligrid.com</a>
                </div>
              </div>
            `
          },
          attachment: { content: base64Content, name: filename }
        })
      })

      if (!res.ok) {
        const bodyText = await res.text()
        throw new Error(bodyText || `Server returned status ${res.status}`)
      }

      showNotification({ variant: 'success', title: 'Email Sent!', message: `Sent proposal to ${proposal.client_email}.` })
      if (proposal.status === 'draft') await updateStatus(proposal, 'sent')
    } catch (err) {
      showNotification({ variant: 'error', title: 'Failed to send email', message: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSendingEmail(false)
      setPreviewProposal(null)
    }
  }

  async function deleteProposal(id: string) {
    const confirmDelete = window.confirm("Are you sure you want to delete this proposal?")
    if (!confirmDelete) return
    const { error } = await supabase.from('proposals').delete().eq('id', id)
    if (error) { showNotification({ variant: 'error', title: 'Failed to delete', message: error.message }); return }
    setProposals(proposals.filter(p => p.id !== id))
    setPreviewProposal(null)
    showNotification({ variant: 'success', title: 'Proposal deleted' })
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
          await supabase.from('proposals').update({
            status: 'accepted',
            event_id: evt.id,
            responded_at: new Date().toISOString()
          }).eq('id', proposal.id)
          const budgetAllocations = proposal.sections.map(s => ({
            event_id: evt.id,
            category: s.category || 'Other',
            allocated: s.amount || 0,
          }))
          if (budgetAllocations.length > 0) {
            await supabase.from('budget_allocations').insert(budgetAllocations)
          }
          showNotification({ variant: 'success', title: 'Converted successfully!', message: `Created live event "${proposal.title}"` })
          setProposals(proposals.map(p => p.id === proposal.id ? { ...p, status: 'accepted', event_id: evt.id } as Proposal : p))
          setSaving(false)
          navigate(`/events/${evt.id}`)
        }}
      ]
    })
  }

  async function reopenProposal(proposal: Proposal) {
    await updateStatus(proposal, 'draft')
  }

  async function handleEmailClient(format: 'pdf' | 'excel') {
    const proposal = previewProposal
    if (!proposal) return
    await sendProposalEmail(proposal, format)
  }

  const columns: TableColumn[] = [
    { key: 'title', label: 'Title' },
    { key: 'client_email', label: 'Client Email' },
    { key: 'status', label: 'Status' },
    { key: 'total', label: 'Total Amount', className: styles.colRight, headerClassName: styles.colRight },
    { key: 'valid_until', label: 'Valid Until', className: styles.colRight, headerClassName: styles.colRight },
    { key: 'actions', label: 'Actions', className: styles.colRight, headerClassName: styles.colRight },
  ]

  if (loading) return <div><div className="skeleton skeleton-card" style={{ height: 300 }} /></div>

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
          { key: 'draft', label: 'Drafts' },
          { key: 'sent', label: 'Sent & Pending' },
          { key: 'approved', label: 'Approved & Decisions' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      <Table
        columns={columns}
        loading={loading}
        empty={filtered.length === 0}
        emptyIcon={FileSignature}
        emptyTitle="No proposals yet"
        emptyDescription={
          isReadOnly ? 'This event is archived and has no proposals.' : 'Create your first proposal to send to clients.'
        }
      >
        {filtered.map(p => (
          <tr key={p.id} className={styles.tableRow} onClick={() => setPreviewProposal(p)}>
            <td className={styles.tableCell}>
              <div className={styles.cellTitle}>{p.title}</div>
              <div className={styles.cellSub}>{new Date(p.created_at).toLocaleDateString()}</div>
            </td>
            <td className={styles.tableCell}>
              <span className={styles.cellEmail}>{p.client_email || <span className={styles.noEmail}>No email</span>}</span>
            </td>
            <td className={styles.tableCell}>
              <span className={styles.statusBadge} style={{ background: `${statusColors[p.status] || 'var(--color-accent)'}15`, color: statusColors[p.status] || 'var(--color-accent)' }}>
                {p.status}
              </span>
            </td>
            <td className={styles.tableCell} style={{ textAlign: 'right' }}>
              <span className={styles.cellAmount}>{fmtMoney(p.total_amount)}</span>
            </td>
            <td className={styles.tableCell} style={{ textAlign: 'right' }}>
              <span className={styles.cellDate}>{p.valid_until ? new Date(p.valid_until).toLocaleDateString() : '—'}</span>
            </td>
            <td className={styles.tableCell} style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
              <div className={styles.actionButtons}>
                {!isReadOnly && p.status === 'draft' && (
                  <>
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit" style={{ padding: '0 6px', minHeight: 28 }}>
                      <Pencil size={13} />
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => handleSend(p)} title="Send" style={{ padding: '0 8px', minHeight: 28, gap: 4, fontSize: 'var(--text-xs)' }}>
                      <Send size={12} /> Send
                    </button>
                  </>
                )}
                {!isReadOnly && p.status === 'accepted' && (
                  <button className="btn btn-primary btn-sm" onClick={() => convertToEvent(p)} title="Convert to Event" style={{ padding: '0 8px', minHeight: 28, gap: 4, fontSize: 'var(--text-xs)' }}>
                    <RefreshCw size={12} /> Convert
                  </button>
                )}
                {!isReadOnly && p.status === 'rejected' && (
                  <button className="btn btn-secondary btn-sm" onClick={() => reopenProposal(p)} title="Reopen" style={{ padding: '0 8px', minHeight: 28, gap: 4, fontSize: 'var(--text-xs)' }}>
                    <RefreshCw size={12} /> Reopen
                  </button>
                )}
                {!isReadOnly && p.status !== 'draft' && (
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)} title="Edit" style={{ padding: '0 6px', minHeight: 28 }}>
                    <Pencil size={13} />
                  </button>
                )}
                {!isReadOnly && (
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteProposal(p.id)} title="Delete" style={{ padding: '0 6px', minHeight: 28, color: 'var(--color-error)' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>

      {/* Create form modal */}
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
              <div className={styles.modalInputGrid}>
                <div className="input-wrapper"><label className="input-label">Valid Until</label>
                  <button className="input" type="button" onClick={() => setShowValidUntil(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
                    <Calendar size={14} /> {form.validUntil ? new Date(form.validUntil + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
                  </button>
                  <CalendarModal open={showValidUntil} value={form.validUntil} onChange={d => { setForm({...form, validUntil: d}); setShowValidUntil(false) }} onClose={() => setShowValidUntil(false)} />
                </div>
                <div className="input-wrapper"><label className="input-label">Client Recipient Email *</label><input className="input" type="email" required value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@example.com" /></div>
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
                  <div className={styles.formAddGrid}>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Budget Category</label>
                      <select
                        className={styles.catSelect}
                        value={sectionForm.category}
                        onChange={e => setSectionForm({...sectionForm, category: e.target.value})}
                      >
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Specification / Title</label>
                      <input className="input" placeholder="e.g. Standard Sound System" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} style={{ height: 36 }} />
                    </div>
                  </div>
                  <div className={styles.addSectionRow}>
                    <input className={`input ${styles.descInput}`} placeholder="Deliverables description..." value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} />
                    <input className={`input ${styles.priceInput}`} type="number" placeholder="Price (₦)" value={sectionForm.amount || ''} onChange={e => setSectionForm({...sectionForm, amount: Number(e.target.value)})} />
                    <button className={`btn btn-secondary btn-sm ${styles.addButton}`} onClick={addSection} disabled={!sectionForm.title || sectionForm.amount <= 0}>Add Item</button>
                  </div>
                </div>
                {form.totalAmount > 0 && <div className={styles.formTotalsRow}><strong>Grand Total Proposed: {fmtMoney(form.totalAmount)}</strong></div>}
              </div>

              <div className={styles.modalFooter}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-secondary" onClick={() => handleSave('draft')} disabled={saving}>{saving ? 'Saving...' : 'Save as Draft'}</button>
                <button className="btn btn-primary" onClick={() => handleSave('sent')} disabled={saving || !form.clientEmail}><Send size={14} /> {saving ? 'Sending...' : 'Send Quote'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit form modal */}
      {editingProposal && (
        <div className="overlay" onClick={closeEdit}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">Edit Proposal</h3>
              <button className="modal-card-close" onClick={closeEdit}><X size={18} /></button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="input-wrapper"><label className="input-label">Proposal Title *</label><input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              <div className="input-wrapper"><label className="input-label">Description / Scope of Work</label><textarea className="input" rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              <div className={styles.modalInputGrid}>
                <div className="input-wrapper"><label className="input-label">Valid Until</label>
                  <button className="input" type="button" onClick={() => setShowEditValidUntil(true)} style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, height: 40 }}>
                    <Calendar size={14} /> {form.validUntil ? new Date(form.validUntil + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Select date...'}
                  </button>
                  <CalendarModal open={showEditValidUntil} value={form.validUntil} onChange={d => { setForm({...form, validUntil: d}); setShowEditValidUntil(false) }} onClose={() => setShowEditValidUntil(false)} />
                </div>
                <div className="input-wrapper"><label className="input-label">Client Recipient Email *</label><input className="input" type="email" required value={form.clientEmail} onChange={e => setForm({...form, clientEmail: e.target.value})} placeholder="client@example.com" /></div>
              </div>

              <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: 16 }}>
                <label className="input-label" style={{ marginBottom: 12, display: 'block', fontWeight: 600 }}>Proposed Items & Event Categories</label>
                <div className={styles.formSectionsList}>
                  {form.sections.length === 0 && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', textAlign: 'center', padding: '16px 0' }}>No line items yet</div>
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
                  <div className={styles.formAddGrid}>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Budget Category</label>
                      <select
                        className={styles.catSelect}
                        value={sectionForm.category}
                        onChange={e => setSectionForm({...sectionForm, category: e.target.value})}
                      >
                        {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="input-wrapper">
                      <label className="input-label" style={{ fontSize: 10 }}>Specification / Title</label>
                      <input className="input" placeholder="e.g. Standard Sound System" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} style={{ height: 36 }} />
                    </div>
                  </div>
                  <div className={styles.addSectionRow}>
                    <input className={`input ${styles.descInput}`} placeholder="Deliverables description..." value={sectionForm.description} onChange={e => setSectionForm({...sectionForm, description: e.target.value})} />
                    <input className={`input ${styles.priceInput}`} type="number" placeholder="Price (₦)" value={sectionForm.amount || ''} onChange={e => setSectionForm({...sectionForm, amount: Number(e.target.value)})} />
                    <button className={`btn btn-secondary btn-sm ${styles.addButton}`} onClick={addSection} disabled={!sectionForm.title || sectionForm.amount <= 0}>Add Item</button>
                  </div>
                </div>
                {form.totalAmount > 0 && <div className={styles.formTotalsRow}><strong>Grand Total Proposed: {fmtMoney(form.totalAmount)}</strong></div>}
              </div>

              <div className={styles.modalFooter}>
                <button className="btn btn-ghost" onClick={closeEdit}>Cancel</button>
                <button className="btn btn-primary" onClick={handleEditSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview modal */}
      {previewProposal && (
        <div className="overlay" onClick={() => setPreviewProposal(null)}>
          <div className={styles.previewModal} onClick={e => e.stopPropagation()}>
            <div className={styles.previewModalHeader}>
              <div className={styles.headerTitleRow}>
                <h3 style={{ margin: 0, fontWeight: 600, fontSize: 'var(--text-base)' }}>{previewProposal.title}</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => setPreviewProposal(null)}><X size={16} /></button>
              </div>
              <div className={styles.previewModalActions}>
                <button className="btn btn-secondary btn-sm" onClick={() => { const g = groupedSectionsFor(previewProposal); exportProposalToExcel(g, previewProposal.title, previewProposal.total_amount) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={13} /> Excel
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { const g = groupedSectionsFor(previewProposal); exportProposalToPDF(g, previewProposal.title, previewProposal.total_amount, previewProposal.description || '') }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Download size={13} /> PDF
                </button>
                <button className="btn btn-secondary btn-sm" disabled={sendingEmail} onClick={() => handleEmailClient('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sendingEmail ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />} Email PDF
                </button>
                <button className="btn btn-secondary btn-sm" disabled={sendingEmail} onClick={() => handleEmailClient('excel')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sendingEmail ? <RefreshCw size={13} className="animate-spin" /> : <Mail size={13} />} Email Excel
                </button>
              </div>
            </div>

            <div className={styles.previewModalBody}>
              <div className={styles.proposalSheet}>
                <div className={styles.proposalDocHeader}>
                  <div>
                    <h2 className={styles.brandTitle}>NaliGrid</h2>
                    <span className={styles.brandSub}>Client Quote & Cost Estimates</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.proposalDocStatus} style={{ borderColor: statusColors[previewProposal.status] || 'var(--color-accent)', color: statusColors[previewProposal.status] || 'var(--color-accent)' }}>
                      {previewProposal.status}
                    </span>
                  </div>
                </div>

                <div className={styles.docMetadata}>
                  <div>
                    <span className={styles.metaLabel}>Client Recipient</span>
                    <strong className={styles.metaValue}>{previewProposal.client_email || 'No Client Email Specified'}</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={styles.metaLabel}>Valid Until</span>
                    <span className={styles.metaValue}>{previewProposal.valid_until ? new Date(previewProposal.valid_until).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>

                {previewProposal.description && (
                  <div className={styles.docDescBlock}>
                    <p>{previewProposal.description}</p>
                  </div>
                )}

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
                        {groupedSectionsFor(previewProposal).map((row) => {
                          const pctOfTotal = previewProposal.total_amount > 0 ? (row.amount / previewProposal.total_amount) * 100 : 0
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
                                <span className={`${styles.statusBadge} ${styles.statusOnTrack}`}>Proposed</span>
                              </td>
                              <td className={styles.td}>
                                <div className={styles.progressContainer}>
                                  <div className={styles.progressBarBg}>
                                    <div className={styles.progressBarFill} style={{ width: `${Math.min(pctOfTotal, 100)}%`, backgroundColor: 'var(--color-accent)' }} />
                                  </div>
                                  <span className={styles.progressPct}>{Math.round(pctOfTotal)}%</span>
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
                    <strong>{fmtMoney(previewProposal.total_amount)}</strong>
                  </div>
                </div>

                <div className={styles.breakdownSection}>
                  <h4 className={styles.breakdownHeading}>Detailed Specifications & Deliverables</h4>
                  <div className={styles.breakdownList}>
                    {activeSectionsFor(previewProposal).map((s, idx) => (
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
          </div>
        </div>
      )}
    </div>
  )
}
