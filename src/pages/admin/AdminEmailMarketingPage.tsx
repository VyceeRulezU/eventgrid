import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Mail, Plus, Send, Clock, CheckCircle, XCircle, FileText, Trash2, Sparkles, Loader2, CalendarDays, RefreshCw } from 'lucide-react'
import { Checkbox } from '@/components/ui/Checkbox'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { TimeModal } from '@/components/ui/TimeModal'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { Table } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body_html: string
  category: string
  created_at: string
}

interface EmailCampaign {
  id: string
  subject: string
  body_html: string
  content_mode: 'manual' | 'template' | 'ai'
  template_id: string | null
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled'
  scheduled_for: string | null
  sent_at: string | null
  recipient_count: number
  created_at: string
}

const STATUS_ICONS: Record<string, typeof FileText> = {
  draft: FileText,
  scheduled: Clock,
  sending: Loader2,
  sent: CheckCircle,
  cancelled: XCircle,
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'var(--color-text-muted)',
  scheduled: 'var(--color-warning)',
  sending: 'var(--color-accent)',
  sent: 'var(--color-success)',
  cancelled: 'var(--color-error)',
}

const campaignTabs: TabItem<string>[] = [
  { key: 'campaigns', label: 'Campaigns', icon: <Mail size={16} /> },
  { key: 'templates', label: 'Templates', icon: <FileText size={16} /> },
  { key: 'new', label: 'New Campaign', icon: <Plus size={16} /> },
]

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AdminEmailMarketingPage() {
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const [activeTab, setActiveTab] = useState('campaigns')

  // Campaigns list
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [loadingCampaigns, setLoadingCampaigns] = useState(true)

  // Templates list
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  // New campaign form
  const [subject, setSubject] = useState('')
  const [bodyHtml, setBodyHtml] = useState('')
  const [contentMode, setContentMode] = useState<'manual' | 'template' | 'ai'>('manual')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [saving, setSaving] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 12
  const pageCount = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE))
  const pageData = campaigns.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const allSelected = pageData.length > 0 && pageData.every(c => selectedCampaigns.has(c.id))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)

  function toggleSelectCampaign(id: string) {
    const next = new Set(selectedCampaigns)
    if (next.has(id)) next.delete(id); else next.add(id)
    setSelectedCampaigns(next)
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedCampaigns(new Set())
    } else {
      setSelectedCampaigns(new Set(pageData.map(c => c.id)))
    }
  }

  async function handleBulkSend() {
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    let totalSent = 0
    let totalFailed = 0
    for (const id of selectedCampaigns) {
      try {
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ campaign_id: id }),
        })
        const result = await res.json()
        if (result.success) {
          totalSent += result.sent || 0
        } else {
          totalFailed++
        }
      } catch {
        totalFailed++
      }
    }
    showToast({ type: totalFailed === 0 ? 'success' : 'warning', title: 'Bulk send complete', body: `${totalSent} emails sent, ${totalFailed} failed` })
    setSelectedCampaigns(new Set())
    loadCampaigns()
  }

  async function handleBulkDelete() {
    for (const id of selectedCampaigns) {
      await supabase.from('email_campaigns').delete().eq('id', id)
    }
    showToast({ type: 'success', title: 'Deleted', body: `${selectedCampaigns.size} campaign(s) deleted` })
    setSelectedCampaigns(new Set())
    loadCampaigns()
  }

  async function handleBulkReset() {
    for (const id of selectedCampaigns) {
      await supabase.from('email_campaigns').update({ status: 'draft', sent_at: null }).eq('id', id)
    }
    showToast({ type: 'success', title: 'Reset', body: `${selectedCampaigns.size} campaign(s) reset to draft` })
    setSelectedCampaigns(new Set())
    loadCampaigns()
  }

  const loadCampaigns = useCallback(async () => {
    setLoadingCampaigns(true)
    const { data } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setCampaigns(data as EmailCampaign[])
    setLoadingCampaigns(false)
  }, [])

  const loadTemplates = useCallback(async () => {
    setLoadingTemplates(true)
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setTemplates(data as EmailTemplate[])
    setLoadingTemplates(false)
  }, [])

  useEffect(() => {
    loadCampaigns()
    loadTemplates()
  }, [loadCampaigns, loadTemplates])

  // Reset page when campaigns change and current page is out of range
  useEffect(() => {
    if (page >= pageCount) setPage(0)
  }, [campaigns.length, page, pageCount])

  const handleSyncSubscribers = async () => {
    setSyncing(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-sync`,
        { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } },
      )
      const result = await res.json()
      if (result.success) {
        showToast({ type: 'success', title: 'Subscribers synced', body: `${result.imported} contacts imported (${result.failed} failed)` })
      } else {
        showToast({ type: 'error', title: 'Sync failed', body: result.error || 'Unknown error' })
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Sync failed', body: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSyncing(false)
    }
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) return
    setGenerating(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email-content`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ prompt: aiPrompt }),
        },
      )
      const result = await res.json()
      if (result.subject && result.body_html) {
        setSubject(result.subject)
        setBodyHtml(result.body_html)
        showToast({ type: 'success', title: 'Content generated', body: 'Review and edit before sending.' })
      } else if (result.error?.includes('quota') || result.error?.includes('RESOURCE_EXHAUSTED')) {
        showToast({ type: 'error', title: 'AI quota exceeded', body: 'Gemini API free tier quota is exhausted. Try again later or upgrade your plan.' })
      } else {
        showToast({ type: 'error', title: 'Generation failed', body: result.error || 'Could not generate content' })
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Generation failed', body: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setGenerating(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const tmpl = templates.find(t => t.id === templateId)
    if (tmpl) {
      setSubject(tmpl.subject)
      setBodyHtml(tmpl.body_html)
    }
    setSelectedTemplateId(templateId)
  }

  const handleSaveCampaign = async (status: 'draft' | 'scheduled') => {
    if (!subject.trim() || !bodyHtml.trim()) {
      showToast({ type: 'error', title: 'Missing fields', body: 'Subject and content are required.' })
      return
    }

    setSaving(true)
    let scheduledFor: string | null = null
    if (status === 'scheduled' && scheduleDate) {
      scheduledFor = `${scheduleDate}T${scheduleTime || '09:00'}:00`
    }

    const { error } = await supabase.from('email_campaigns').insert({
      subject: subject.trim(),
      body_html: bodyHtml,
      content_mode: contentMode,
      template_id: selectedTemplateId || null,
      status,
      scheduled_for: scheduledFor,
      created_by: user?.id,
    })

    if (error) {
      showToast({ type: 'error', title: 'Failed to save', body: error.message })
    } else {
      showToast({ type: 'success', title: status === 'draft' ? 'Draft saved' : 'Campaign scheduled', body: status === 'draft' ? 'You can send it later from the campaigns list.' : `Scheduled for ${formatDate(scheduledFor)}` })
      setSubject('')
      setBodyHtml('')
      setSelectedTemplateId('')
      setAiPrompt('')
      setScheduleDate('')
      setScheduleTime('')
      setActiveTab('campaigns')
      loadCampaigns()
    }
    setSaving(false)
  }

  const handleSendCampaign = async (campaignId: string) => {
    setSending(campaignId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/brevo-send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ campaign_id: campaignId }),
        },
      )
      const result = await res.json()
      if (result.success) {
        showToast({ type: 'success', title: 'Campaign sent', body: `${result.sent} emails delivered (${result.failed} failed)` })
        loadCampaigns()
      } else {
        showToast({ type: 'error', title: 'Send failed', body: result.error || 'Unknown error' })
      }
    } catch (err) {
      showToast({ type: 'error', title: 'Send failed', body: err instanceof Error ? err.message : 'Network error' })
    } finally {
      setSending(null)
    }
  }

  const handleDeleteCampaign = async (id: string) => {
    const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
    if (!error) {
      showToast({ type: 'success', title: 'Campaign deleted' })
      loadCampaigns()
    }
  }

  const handleResetCampaign = async (id: string) => {
    const { error } = await supabase.from('email_campaigns').update({ status: 'draft', sent_at: null }).eq('id', id)
    if (!error) {
      showToast({ type: 'success', title: 'Campaign reset', body: 'You can now edit and resend it.' })
      loadCampaigns()
    }
  }

  const handleSaveTemplate = async () => {
    if (!subject.trim() || !bodyHtml.trim()) {
      showToast({ type: 'error', title: 'Missing fields', body: 'Subject and content are required.' })
      return
    }
    const name = prompt('Template name:')
    if (!name) return

    const { error } = await supabase.from('email_templates').insert({
      name,
      subject: subject.trim(),
      body_html: bodyHtml,
      created_by: user?.id,
    })

    if (error) {
      showToast({ type: 'error', title: 'Failed to save template', body: error.message })
    } else {
      showToast({ type: 'success', title: 'Template saved' })
      loadTemplates()
    }
  }

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from('email_templates').delete().eq('id', id)
    if (!error) {
      showToast({ type: 'success', title: 'Template deleted' })
      loadTemplates()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-6)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        <Tabs tabs={campaignTabs} activeTab={activeTab} onChange={setActiveTab} />
        <button className="btn btn-ghost btn-sm" onClick={handleSyncSubscribers} disabled={syncing} style={{ flexShrink: 0 }}>
          {syncing ? <Loader2 size={14} className="spin" /> : <Loader2 size={14} />} {syncing ? 'Syncing...' : 'Sync Subscribers'}
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 'var(--space-6)' }}>
        {/* ── CAMPAIGNS TAB ── */}
        {activeTab === 'campaigns' && (
          <div>
            <Table
              columns={[
                { key: 'select', label: '', renderHeader: () => <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" /> },
                { key: 'subject', label: 'Subject' },
                { key: 'mode', label: 'Mode' },
                { key: 'status', label: 'Status' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'sent', label: 'Sent' },
                { key: 'actions', label: '', className: 'actions', headerClassName: 'actions' },
              ]}
              loading={loadingCampaigns}
              empty={campaigns.length === 0}
              emptyIcon={Mail}
              emptyTitle="No campaigns yet"
              emptyDescription="Create your first email campaign to get started."
              bulkBar={selectedCampaigns.size > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '100%' }}>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{selectedCampaigns.size} selected</span>
                  <button className="btn btn-primary btn-sm" onClick={handleBulkSend} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Send size={12} /> Send
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={handleBulkReset} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <RefreshCw size={12} /> Reset to Draft
                  </button>
                  <button className="btn btn-destructive btn-sm" onClick={handleBulkDelete}>
                    Delete
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedCampaigns(new Set())}>
                    Clear
                  </button>
                </div>
              ) : undefined}
              footer={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
                  <Pagination currentPage={page + 1} totalPages={pageCount} onPageChange={(p) => setPage(p - 1)} />
                </div>
              }
            >
              {pageData.map((c) => {
                const StatusIcon = STATUS_ICONS[c.status]
                return (
                  <tr key={c.id}>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <Checkbox
                        checked={selectedCampaigns.has(c.id)}
                        onChange={() => toggleSelectCampaign(c.id)}
                        aria-label={`Select ${c.subject}`}
                      />
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>{c.subject}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{c.content_mode}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 'var(--text-xs)', color: STATUS_COLORS[c.status] }}>
                        <StatusIcon size={12} />
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatDate(c.scheduled_for)}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{c.recipient_count || '—'}</td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                        {c.status === 'draft' && (
                          <>
                            <button className="btn btn-primary btn-sm" onClick={() => handleSendCampaign(c.id)} disabled={sending === c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              {sending === c.id ? <Loader2 size={12} className="spin" /> : <Send size={12} />}
                              {sending === c.id ? 'Sending...' : 'Send'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteCampaign(c.id)} style={{ color: 'var(--color-error)' }}>
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        {c.status === 'sent' && (
                          <>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleResetCampaign(c.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <RefreshCw size={12} /> Send Again
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteCampaign(c.id)} style={{ color: 'var(--color-error)' }}>
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </Table>
          </div>
        )}

        {/* ── TEMPLATES TAB ── */}
        {activeTab === 'templates' && (
          <div>
            {loadingTemplates ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>Loading templates...</div>
            ) : templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-8)', color: 'var(--color-text-muted)' }}>
                <FileText size={32} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
                <div style={{ fontWeight: 600 }}>No templates yet</div>
                <div style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>Save a campaign as a template to reuse it later.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {templates.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) var(--space-4)', background: 'var(--color-surface-2)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{t.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>{t.subject}</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteTemplate(t.id)} style={{ color: 'var(--color-error)' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NEW CAMPAIGN TAB ── */}
        {activeTab === 'new' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Content Mode</label>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {(['manual', 'template', 'ai'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`btn btn-sm ${contentMode === mode ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setContentMode(mode); setSelectedTemplateId(''); setAiPrompt('') }}
                  >
                    {mode === 'manual' ? 'Manual' : mode === 'template' ? 'From Template' : 'AI-Generated'}
                  </button>
                ))}
              </div>
            </div>

            {contentMode === 'template' && templates.length > 0 && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Select Template</label>
                <DropdownMenu
                  trigger={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={14} />
                      {selectedTemplateId
                        ? templates.find(t => t.id === selectedTemplateId)?.name || 'Select template'
                        : 'Select template'}
                    </span>
                  }
                  items={templates.map(t => ({ label: t.name, value: t.id, description: t.subject }))}
                  onSelect={(item) => handleTemplateSelect(item.value)}
                />
              </div>
            )}

            {contentMode === 'ai' && (
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Describe what you want to write about</label>
                <textarea
                  className="input"
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g. A weekly newsletter about new features, tips for event planners, and upcoming webinars"
                  style={{ width: '100%', resize: 'vertical' }}
                />
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleGenerateAi}
                  disabled={generating || !aiPrompt.trim()}
                  style={{ marginTop: 'var(--space-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                >
                  {generating ? <Loader2 size={14} className="spin" /> : <Sparkles size={14} />}
                  {generating ? 'Generating...' : 'Generate with AI'}
                </button>
              </div>
            )}

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Subject</label>
              <input
                className="input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'block', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>Content (HTML)</label>
              <textarea
                className="input"
                rows={12}
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                placeholder="<h1>Your email content here...</h1>"
                style={{ width: '100%', resize: 'vertical', fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}
              />
            </div>

            <div style={{ marginBottom: 'var(--space-4)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
                <Checkbox
                  checked={!!scheduleDate}
                  onChange={(e) => { if (!e.target.checked) { setScheduleDate(''); setScheduleTime('') } else { setScheduleDate(new Date().toISOString().split('T')[0]) }}}
                />
                Schedule for later
              </label>
              {scheduleDate && (
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="input"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start', width: '100%' }}
                      onClick={() => setShowDatePicker(true)}
                    >
                      <CalendarDays size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span style={{ color: scheduleDate ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {scheduleDate
                          ? new Date(scheduleDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                          : 'Select date'}
                      </span>
                    </button>
                    <CalendarModal
                      open={showDatePicker}
                      value={scheduleDate}
                      onChange={(d) => { setScheduleDate(d); setShowDatePicker(false) }}
                      onClose={() => setShowDatePicker(false)}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      className="input"
                      style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', textAlign: 'left', justifyContent: 'flex-start', width: '100%' }}
                      onClick={() => setShowTimePicker(true)}
                    >
                      <Clock size={14} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <span style={{ color: scheduleTime ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                        {scheduleTime || 'Select time'}
                      </span>
                    </button>
                    <TimeModal
                      open={showTimePicker}
                      value={scheduleTime || '09:00'}
                      onChange={(t) => { setScheduleTime(t); setShowTimePicker(false) }}
                      onClose={() => setShowTimePicker(false)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <button className="btn btn-primary" onClick={() => handleSaveCampaign(scheduleDate ? 'scheduled' : 'draft')} disabled={saving}>
                {saving ? 'Saving...' : scheduleDate ? 'Schedule Campaign' : 'Save as Draft'}
              </button>
              <button className="btn btn-secondary" onClick={handleSaveTemplate} disabled={saving}>
                <FileText size={14} /> Save as Template
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
