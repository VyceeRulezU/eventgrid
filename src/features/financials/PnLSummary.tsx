import { TrendingUp, TrendingDown } from 'lucide-react'

function formatNaira(kobo: number) {
  return `₦${(kobo / 100).toLocaleString('en-NG')}`
}

interface PnLSummaryProps {
  totalRevenue: number
  totalVendorCost: number
  pettyCashTotal: number
}

export function PnLSummary({ totalRevenue, totalVendorCost, pettyCashTotal }: PnLSummaryProps) {
  const totalCost = totalVendorCost + pettyCashTotal
  const grossProfit = totalRevenue - totalCost
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const marginColor = margin > 20 ? 'var(--color-success)' : margin > 10 ? 'var(--color-warning)' : 'var(--color-error)'

  return (
    <div className="card" style={{ padding: 'var(--space-4) var(--space-5)', marginBottom: 'var(--space-4)' }}>
      <style>{`@media (max-width: 480px) { .pnl-grid { grid-template-columns: 1fr !important; } }`}</style>
      <h3 style={{ margin: '0 0 var(--space-3) 0', fontSize: 'var(--text-base)', fontWeight: 700 }}>
        Event P&L
      </h3>
      <div className="pnl-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2) var(--space-6)', fontSize: 'var(--text-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Total Revenue</span>
          <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatNaira(totalRevenue)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Total Vendor Cost</span>
          <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>-{formatNaira(totalVendorCost)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Petty Cash</span>
          <span style={{ fontWeight: 600, color: 'var(--color-error)' }}>-{formatNaira(pettyCashTotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-1) 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
          <span style={{ color: 'var(--color-text-secondary)' }}>Net to Vendor</span>
          <span style={{ fontWeight: 600 }}>{formatNaira(totalRevenue - totalVendorCost)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--space-2) 0', gridColumn: '1 / -1' }}>
          <span style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>
            {grossProfit >= 0 ? <TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--color-success)' }} /> : <TrendingDown size={16} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--color-error)' }} />}
            Gross Profit
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: marginColor }}>{formatNaira(grossProfit)}</span>
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${marginColor}20`, color: marginColor }}>
              {margin.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
