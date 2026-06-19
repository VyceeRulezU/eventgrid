export const PRO_BONO = import.meta.env.VITE_PRO_BONO === 'true'

export const EVENT_FEE_DISPLAY = PRO_BONO ? '₦100' : '₦20,000'

export const EVENT_FEE_DISPLAY_FULL = PRO_BONO ? '₦100 (pro bono)' : '₦20,000'

export const EVENT_FEE_KOBO = PRO_BONO ? 10000 : 2000000

export const EVENT_FEE_FORMATTED = PRO_BONO ? '100' : '20,000'
