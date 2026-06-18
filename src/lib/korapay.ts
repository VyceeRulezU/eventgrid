export interface KorapayConfig {
  key: string
  reference: string
  amount: number
  currency: string
  email: string
  customerName?: string
  metadata?: Record<string, unknown>
  onSuccess: (data: { reference: string; status: string }) => void
  onClose: () => void
  onFailed?: (data: { reference: string; status: string }) => void
}

declare global {
  interface Window {
    Korapay: {
      initialize: (config: Record<string, unknown>) => void
      close: () => void
    }
  }
}

const KORAPAY_SCRIPT_URL = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js'
let loadingPromise: Promise<void> | null = null

export function loadKorapayScript(): Promise<void> {
  if (loadingPromise) return loadingPromise

  loadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="korapay-collections"]')
    if (existing && window.Korapay) {
      loadingPromise = null
      resolve()
      return
    }
    if (existing && !window.Korapay) {
      existing.remove()
    }

    const script = document.createElement('script')
    script.src = KORAPAY_SCRIPT_URL
    script.async = true

    const checkReady = () => {
      if (window.Korapay) {
        loadingPromise = null
        resolve()
      } else {
        setTimeout(checkReady, 100)
      }
    }

    script.onload = () => {
      checkReady()
    }

    script.onerror = () => {
      loadingPromise = null
      reject(new Error('Failed to load Korapay script'))
    }

    document.head.appendChild(script)
  })

  return loadingPromise
}

export function initKorapayPayment(config: KorapayConfig): void {
  window.Korapay.initialize({
    key: config.key,
    reference: config.reference,
    amount: config.amount,
    currency: config.currency,
    customer: {
      name: config.customerName || config.email,
      email: config.email,
    },
    channels: ['card', 'bank_transfer'],
    default_channel: 'card',
    merchant_bears_cost: true,
    metadata: config.metadata,
    notification_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/korapay-webhook`,
    onSuccess: (data: { reference: string; status: string }) => config.onSuccess(data),
    onClose: () => config.onClose(),
    onFailed: (data: { reference: string; status: string }) => config.onFailed?.(data),
  })
}
