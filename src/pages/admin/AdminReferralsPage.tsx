import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { AdminPageHero } from '@/components/shared/AdminPageHero'
import { SearchBar } from '@/components/shared/SearchBar'
import { Button } from '@/components/ui/Button'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { SEO } from '@/components/shared/SEO'
import { Gift, Users, TrendingUp, DollarSign, X, Plus, Trash2, ListChecks, Hash, Link2, Copy, Check } from 'lucide-react'
import { GenerateReferralPortalModal } from '@/features/referrals/GenerateReferralPortalModal'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import type { ReferralPartner, ReferralRedemption, Profile } from '@/types'
import styles from './AdminReferralsPage.module.css'

type RedemptionWithUser = ReferralRedemption & { referred_user?: Pick<Profile, 'display_name' | 'email'> }

function toNaira(kobo: number): string {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(kobo / 100)
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const badgeStyles: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(251, 191, 36, 0.15)', color: '#F59E0B' },
  paid: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981' },
  cancelled: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
}

export function AdminReferralsPage({ embedded, activeSubTab }: { embedded?: boolean; activeSubTab?: 'commissions' | 'codes' }) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'super_admin'

  const [partners, setPartners] = useState<ReferralPartner[]>([])
  const [redemptions, setRedemptions] = useState<RedemptionWithUser[]>([])
  const [, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'commissions' | 'codes'>(activeSubTab || 'codes')
  const [searchQuery, setSearchQuery] = useState('')
  const [commSearch, setCommSearch] = useState('')
  const [commStatusFilter, setCommStatusFilter] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)
  const [showPortalModal, setShowPortalModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', code: '' })
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const showModal = useUIStore((s) => s.showModal)
  const showNotification = useUIStore((s) => s.showNotification)
  const shareUrl = (code: string) => `${window.location.origin}/register?ref=${code}`

  const loadData = useCallback(async () => {
    setLoading(true)
    const [pRes, rRes] = await Promise.all([
      supabase.from('referral_partners').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('referral_redemptions').select('*, referred_user:referred_user_id(display_name, email)').order('created_at', { ascending: false }).limit(200),
    ])
    if (pRes.data) setPartners(pRes.data)
    if (rRes.data) setRedemptions(rRes.data as any)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // --- Search logic ---
  const searchedPartners = useMemo(() => {
    if (!searchQuery) return partners
    const q = searchQuery.toLowerCase()
    return partners.filter((p) =>
      p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    )
  }, [partners, searchQuery])

  // --- Summaries ---
  const summaries = useMemo(() => {
    return partners.map((p) => {
      const partnerReds = redemptions.filter((r) => r.partner_id === p.id)
      return {
        partner: p,
        signups: new Set(partnerReds.map((r) => r.referred_user_id)).size,
        activations: partnerReds.length,
        commissionEarned: partnerReds.reduce((sum, r) => sum + Number(r.commission_amount), 0),
        commissionPaid: partnerReds.filter((r) => r.status === 'paid').reduce((sum, r) => sum + Number(r.commission_amount), 0),
        commissionOutstanding: partnerReds.filter((r) => r.status === 'pending').reduce((sum, r) => sum + Number(r.commission_amount), 0),
      }
    })
  }, [partners, redemptions])

  // --- Overview stats ---
  const totalCodes = partners.length
  const totalTransactions = redemptions.length
  const totalCommissionEarned = summaries.reduce((sum, s) => sum + s.commissionEarned, 0)
  const totalSignups = summaries.reduce((sum, s) => sum + s.signups, 0)

  // --- Filtered redemptions (commissions tab) ---
  const filteredRedemptions = useMemo(() => {
    let list = redemptions
    if (commStatusFilter !== 'all') {
      list = list.filter((r) => r.status === commStatusFilter)
    }
    if (commSearch) {
      const q = commSearch.toLowerCase()
      list = list.filter((r) => {
        const partner = partners.find((p) => p.id === r.partner_id)
        const nameMatch = partner?.name.toLowerCase().includes(q)
        const userMatch = (r as any).referred_user?.display_name?.toLowerCase().includes(q)
          || (r as any).referred_user?.email?.toLowerCase().includes(q)
        return nameMatch || userMatch
      })
    }
    return list
  }, [redemptions, commStatusFilter, commSearch, partners])



  // --- Modal handlers ---
  const resetForm = () => { setForm({ name: '', email: '', phone: '', code: '' }) }

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      showNotification({ variant: 'error', title: 'Name and code are required' })
      return
    }
    setSaving(true)
    const { error } = await supabase.from('referral_partners').insert({
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      commission_amount: 500000,
      commission_type: 'per_activation',
      is_active: true,
    })
    setSaving(false)
    if (error) {
      showNotification({ variant: 'error', title: 'Failed to create', message: error.message })
      return
    }
    showNotification({ variant: 'success', title: 'Referral code created' })
    setShowForm(false)
    resetForm()
    loadData()
  }

  const handleDelete = (partner: ReferralPartner) => {
    showModal({
      variant: 'confirm',
      title: `Delete "${partner.code}"?`,
      message: `This will permanently remove ${partner.name} and their referral code. ${redemptions.filter((r) => r.partner_id === partner.id).length} commission records will be orphaned.`,
      actions: [
        { label: 'Cancel', variant: 'secondary', onClick: () => {} },
        {
          label: 'Delete',
          variant: 'danger',
          onClick: async () => {
            const { error } = await supabase.from('referral_partners').delete().eq('id', partner.id)
            if (error) {
              showNotification({ variant: 'error', title: 'Delete failed', message: error.message })
              return
            }
            showNotification({ variant: 'success', title: `"${partner.code}" deleted` })
            loadData()
          },
        },
      ],
    })
  }

  const tabs: TabItem<'commissions' | 'codes'>[] = [
    { key: 'commissions', label: 'Commissions', icon: <ListChecks size={16} /> },
    { key: 'codes', label: 'Referral Codes', icon: <Hash size={16} /> },
  ]

  const statusFilterOptions = [
    { label: 'All statuses', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Paid', value: 'paid' },
    { label: 'Cancelled', value: 'cancelled' },
  ]

  const commStatusTotal = useMemo(() => {
    if (commStatusFilter === 'all') return null
    return filteredRedemptions.reduce((s, r) => s + Number(r.commission_amount), 0)
  }, [filteredRedemptions, commStatusFilter])

  return (
    <div>
      {!embedded && (
        <>
          <SEO title="Referral Partners — Admin" description="Manage referral partners, codes, and commission payouts" />
          <AdminPageHero
            icon={Gift}
            title="Referrals"
            subtitle="Manage referral partners and commissions"
          />
      </>)
      }

      <div style={{ padding: '0 var(--space-6) var(--space-6)' }}>
        {/* Overview stat cards */}
        <div className={styles.statsGrid}>
          {[
            { icon: Gift, value: `${totalCodes}`, label: 'Total Codes' },
            { icon: Users, value: `${totalSignups}`, label: 'Total Signups' },
            { icon: TrendingUp, value: `${totalTransactions}`, label: 'Total Activations' },
            { icon: DollarSign, value: toNaira(totalCommissionEarned), label: 'Total Commissions' },
          ].map((s) => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statCardHeader}>
                <span className={styles.statLabel}>{s.label}</span>
                <s.icon size={16} style={{ opacity: 0.4 }} />
              </div>
              <div className={styles.statValue}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className={styles.tabsWrapper}>
          {!activeSubTab && <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />}

          {activeTab === 'codes' && (
            <div className={styles.toolbar}>
              {isAdmin && (
                <Button variant="primary" size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
                  <Plus size={16} />
                  Add Referral Code
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowPortalModal(true)}>
                <Link2 size={16} />
                Portal Link
              </Button>
            </div>
          )}
        </div>

        {activeTab === 'codes' ? (
          <>
            {searchedPartners.length === 0 ? (
            <div className={styles.sectionCard}>
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-state__icon"><Gift size={24} /></div>
                <div className="empty-state__title">{searchQuery ? 'No codes found' : 'No referral codes yet'}</div>
                <div className="empty-state__description">
                  {searchQuery ? `No codes match "${searchQuery}"` : 'Create your first referral code to get started.'}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.sectionCard}>
              {searchedPartners.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Search by name or code..."
                    containerStyle={{ maxWidth: 280 }}
                  />
                  <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                    {searchedPartners.length} code{searchedPartners.length !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
              <div className={styles.tableScroll}>
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.codesHead}`}>
                    <span>Name</span>
                    <span>Code</span>
                    <span>Share Link</span>
                    <span>Email</span>
                    <span>Phone</span>
                    <span>Signups</span>
                    <span>Activations</span>
                    <span>Earned</span>
                    <span>Outstanding</span>
                    <span>Status</span>
                    <span />
                  </div>
                  <div className={styles.tableBody}>
                    {searchedPartners.map((p) => {
                      const s = summaries.find((sm) => sm.partner.id === p.id)
                      return (
                        <div key={p.id} className={`${styles.tableRow} ${styles.codesRow}`}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{p.name}</div>
                          <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>{p.code}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {shareUrl(p.code)}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(shareUrl(p.code))
                                setCopiedCode(p.id)
                                setTimeout(() => setCopiedCode(null), 2000)
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-accent)', padding: 2 }}
                              title="Copy share link"
                            >
                              {copiedCode === p.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)' }}>{p.email || '—'}</div>
                          <div style={{ fontSize: 'var(--text-xs)' }}>{p.phone || '—'}</div>
                          <div>{s?.signups || 0}</div>
                          <div>{s?.activations || 0}</div>
                          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: '#10B981' }}>{toNaira(s?.commissionEarned || 0)}</div>
                          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: s && s.commissionOutstanding > 0 ? '#F59E0B' : 'var(--color-text-muted)' }}>{toNaira(s?.commissionOutstanding || 0)}</div>
                          <div>
                            <span style={{
                              display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                              backgroundColor: p.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: p.is_active ? '#10B981' : '#EF4444',
                            }}>
                              {p.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(p)}
                                style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                title="Delete this code"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
              </div>
            </div>
          </div>
          )}
          </>
        ) : (
          /* Commissions table — planner-style */
          <div className={styles.sectionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-5)', borderBottom: '1px solid rgba(255,255,255,0.04)', flexWrap: 'wrap' }}>
              <SearchBar
                value={commSearch}
                onChange={setCommSearch}
                placeholder="Search by partner or user..."
                containerStyle={{ maxWidth: 280 }}
              />
              <DropdownMenu
                trigger={<span>{statusFilterOptions.find((o) => o.value === commStatusFilter)?.label || 'Status'}</span>}
                items={statusFilterOptions.map((o) => ({ label: o.label, value: o.value }))}
                onSelect={(item) => setCommStatusFilter(item.value)}
              />
              {(commSearch || commStatusFilter !== 'all') && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setCommSearch(''); setCommStatusFilter('all') }}>
                  <X size={14} /> Clear filters
                </button>
              )}
              <span style={{ marginLeft: 'auto', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                {filteredRedemptions.length} commission{filteredRedemptions.length !== 1 ? 's' : ''}
                {commStatusFilter !== 'all' && commStatusTotal != null && (
                  <> — total: <strong style={{ color: '#10B981' }}>{toNaira(commStatusTotal)}</strong></>
                )}
              </span>
            </div>
            {filteredRedemptions.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                <div className="empty-state__icon"><ListChecks size={24} /></div>
                <div className="empty-state__title">No commissions yet</div>
                <div className="empty-state__description">
                  {commSearch || commStatusFilter !== 'all' ? 'No commissions match your search or filter.' : 'No referral commissions recorded yet.'}
                </div>
              </div>
            ) : (
              <div className={styles.tableScroll}>
                <div className={styles.table}>
                  <div className={`${styles.tableHead} ${styles.commHead}`}>
                    <span>Partner</span>
                    <span>Referred User</span>
                    <span>Event ID</span>
                    <span>Commission</span>
                    <span>Status</span>
                    <span>Activated</span>
                    <span>Paid</span>
                    <span />
                  </div>
                  <div className={styles.tableBody}>
                    {filteredRedemptions.map((r) => {
                      const partner = partners.find((p) => p.id === r.partner_id)
                      return (
                        <div key={r.id} className={`${styles.tableRow} ${styles.commRow}`}>
                          <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                            {partner?.name || <span style={{ color: 'var(--color-text-muted)' }}>{r.partner_id.slice(0, 8)}</span>}
                          </div>
                          <div>
                            <div style={{ fontSize: 'var(--text-sm)' }}>{(r as any).referred_user?.display_name || 'Unknown'}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{(r as any).referred_user?.email || ''}</div>
                          </div>
                          <div style={{ fontFamily: 'monospace', fontSize: 'var(--text-xs)' }}>
                            {r.event_id?.slice(0, 8) || '—'}
                          </div>
                          <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                            {toNaira(r.commission_amount)}
                          </div>
                          <div>
                            <span style={{
                              display: 'inline-block', padding: '2px 10px', borderRadius: 999,
                              fontSize: 11, fontWeight: 600,
                              backgroundColor: (badgeStyles[r.status] || badgeStyles.pending).bg,
                              color: (badgeStyles[r.status] || badgeStyles.pending).color,
                            }}>
                              {r.status}
                            </span>
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {formatDate(r.activated_at)}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {formatDate(r.paid_at)}
                          </div>
                          <div>
                            {r.status === 'pending' && isAdmin && (
                              <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center' }}>
                                <button
                                  style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                  onClick={async () => {
                                    const { error } = await supabase.from('referral_redemptions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', r.id)
                                    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
                                    showNotification({ variant: 'success', title: 'Marked as paid' })
                                    loadData()
                                  }}
                                >
                                  Mark Paid
                                </button>
                                <button
                                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: 'none', borderRadius: 8, padding: '4px 12px', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                                  onClick={async () => {
                                    const { error } = await supabase.from('referral_redemptions').update({ status: 'cancelled' }).eq('id', r.id)
                                    if (error) { showNotification({ variant: 'error', title: 'Failed', message: error.message }); return }
                                    showNotification({ variant: 'success', title: 'Cancelled' })
                                    loadData()
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Portal Link Modal */}
      {showPortalModal && (
        <GenerateReferralPortalModal
          partners={partners}
          onClose={() => setShowPortalModal(false)}
          onChanged={loadData}
        />
      )}

      {/* Add Referral Code Modal */}
      {showForm && (
        <div className="overlay" onClick={() => { if (!saving) { setShowForm(false); resetForm() } }}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-card-header">
              <h3 className="modal-card-title">Add Referral Code</h3>
              <button className="modal-card-close" onClick={() => { if (!saving) { setShowForm(false); resetForm() } }}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="input-wrapper">
                <label className="input-label">Partner Name *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. Qmaravie"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="input-wrapper">
                  <label className="input-label">Email</label>
                  <input
                    className="input"
                    type="email"
                    placeholder="partner@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="input-wrapper">
                  <label className="input-label">Phone</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="input-wrapper">
                <label className="input-label">Referral Code *</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. QMARAVIE"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
                <Button variant="secondary" onClick={() => { setShowForm(false); resetForm() }}>
                  Cancel
                </Button>
                <Button variant="primary" loading={saving} onClick={handleSave}>
                  Create Code
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
