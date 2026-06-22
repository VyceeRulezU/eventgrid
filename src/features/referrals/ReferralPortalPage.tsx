import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Gift, Users, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { SEO } from '@/components/shared/SEO'
import type { ReferralPortal, ReferralPartner, ReferralRedemption, Profile } from '@/types'
import styles from './ReferralPortalPage.module.css'

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

export function ReferralPortalPage() {
  const { token } = useParams<{ token: string }>()
  const [, setPortal] = useState<ReferralPortal | null>(null)
  const [partner, setPartner] = useState<ReferralPartner | null>(null)
  const [redemptions, setRedemptions] = useState<RedemptionWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) { setError('Invalid portal link.'); setLoading(false); return }

    ;(async () => {
      const { data: portalData, error: portalErr } = await supabase
        .from('referral_portals')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle()

      if (portalErr || !portalData) {
        setError('This portal link is invalid or has been revoked.')
        setLoading(false)
        return
      }

      setPortal(portalData)

      const { data: partnerData } = await supabase
        .from('referral_partners')
        .select('*')
        .eq('id', portalData.partner_id)
        .single()

      if (partnerData) setPartner(partnerData)

      const { data: redData } = await supabase
        .from('referral_redemptions')
        .select('*, referred_user:referred_user_id(display_name, email)')
        .eq('partner_id', portalData.partner_id)
        .order('created_at', { ascending: false })

      if (redData) setRedemptions(redData as any)

      setLoading(false)
    })()
  }, [token])

  const totalSignups = useMemo(() =>
    new Set(redemptions.map((r) => r.referred_user_id)).size,
    [redemptions]
  )
  const totalActivations = redemptions.length
  const totalEarned = useMemo(() =>
    redemptions.reduce((s, r) => s + Number(r.commission_amount), 0),
    [redemptions]
  )
  const totalPaid = useMemo(() =>
    redemptions.filter((r) => r.status === 'paid').reduce((s, r) => s + Number(r.commission_amount), 0),
    [redemptions]
  )

  const partnerName = partner?.name || ''

  if (loading) {
    return (
      <div className={styles.portalPage}>
        <div className={styles.portalHeader}>
          <div className={styles.headerLeft}>
            <img src="/ng-logo-wg.svg" alt="NaliGrid" className={styles.headerLogo} />
          </div>
        </div>
        <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
          <div className="empty-state__title">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.portalPage}>
        <div className={styles.portalHeader}>
          <div className={styles.headerLeft}>
            <img src="/ng-logo-wg.svg" alt="NaliGrid" className={styles.headerLogo} />
          </div>
        </div>
        <div className={styles.errorCard}>
          <div className={styles.errorIcon}><AlertTriangle size={40} /></div>
          <div className={styles.errorTitle}>Portal Not Found</div>
          <div className={styles.errorDesc}>{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.portalPage}>
      <SEO title="Partner Commission Portal" description="View your referral commissions and earnings" noindex />
      {/* Sticky header with logo */}
      <div className={styles.portalHeader}>
        <div className={styles.headerLeft}>
          <img src="/ng-logo-wg.svg" alt="NaliGrid" className={styles.headerLogo} />
          <div className={styles.headerDivider} />
          <span className={styles.headerBadge}>Partner Portal</span>
        </div>
        <div className={styles.headerRight}>
          {partnerName && (
            <span className={styles.headerPartnerName}>{partnerName}</span>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {partner && (
          <div className={styles.partnerInfo}>
            <div className={styles.partnerInfoItem}>
              <div className={styles.partnerInfoLabel}>Partner</div>
              <div className={styles.partnerInfoValue}>{partner.name}</div>
            </div>
            <div className={styles.partnerInfoItem}>
              <div className={styles.partnerInfoLabel}>Referral Code</div>
              <div className={styles.partnerInfoValue} style={{ fontFamily: 'monospace' }}>{partner.code}</div>
            </div>
            <div className={styles.partnerInfoItem}>
              <div className={styles.partnerInfoLabel}>Commission per Activation</div>
              <div className={styles.partnerInfoValue}>{toNaira(partner.commission_amount)}</div>
            </div>
          </div>
        )}

        <div className={styles.statsGrid}>
          {[
            { icon: Gift, value: `${totalActivations}`, label: 'Total Activations' },
            { icon: Users, value: `${totalSignups}`, label: 'Total Signups' },
            { icon: TrendingUp, value: `${totalPaid ? toNaira(totalPaid) : toNaira(0)}`, label: 'Paid Out' },
            { icon: DollarSign, value: toNaira(totalEarned), label: 'Total Commissions' },
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

        <div className={styles.sectionCard}>
          <div className={styles.tableScroll}>
            <div className={styles.table}>
              <div className={`${styles.tableHead} ${styles.portalHead}`}>
                <span>Referred User</span>
                <span>Event ID</span>
                <span>Commission</span>
                <span>Status</span>
                <span>Activated</span>
                <span>Paid</span>
              </div>
              <div className={styles.tableBody}>
                {redemptions.length === 0 ? (
                  <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                    <div className="empty-state__icon"><Gift size={24} /></div>
                    <div className="empty-state__title">No commissions yet</div>
                    <div className="empty-state__description">You haven't earned any referral commissions yet.</div>
                  </div>
                ) : (
                  redemptions.map((r) => (
                    <div key={r.id} className={`${styles.tableRow} ${styles.portalRow}`}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                          {(r as any).referred_user?.display_name || 'Unknown'}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                          {(r as any).referred_user?.email || ''}
                        </div>
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
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}