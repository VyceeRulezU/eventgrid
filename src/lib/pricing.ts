export const PRO_BONO = import.meta.env.VITE_PRO_BONO === 'true'

export const BETA_PRICING_END_DATE = import.meta.env.VITE_BETA_PRICING_END_DATE || null  // e.g. "2026-09-30"
export const BETA_PRICING_CAP = Number(import.meta.env.VITE_BETA_PRICING_CAP) || 0  // e.g. 100 activations

export const BETA_PRICING_ACTIVE = PRO_BONO && (
  (!BETA_PRICING_END_DATE || new Date() < new Date(BETA_PRICING_END_DATE))
)

export const EVENT_FEE_DISPLAY = PRO_BONO ? '₦100' : '₦20,000'

export const EVENT_FEE_DISPLAY_FULL = BETA_PRICING_ACTIVE
  ? `₦100 (beta pricing${BETA_PRICING_END_DATE ? ` — until ${new Date(BETA_PRICING_END_DATE).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''})`
  : PRO_BONO
    ? '₦100 (pro bono)'
    : '₦20,000'

export const EVENT_FEE_KOBO = PRO_BONO ? 10000 : 2000000

export const EVENT_FEE_FORMATTED = PRO_BONO ? '100' : '20,000'
