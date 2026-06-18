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
      initialize: (config: Record<string, unknown>) => Promise<unknown>
      close: () => void
    }
  }
}

const KORAPAY_SCRIPT_URL = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js'
const LOAD_TIMEOUT = 15000
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

    const timeoutId = setTimeout(() => {
      script.onload = null
      script.onerror = null
      loadingPromise = null
      reject(new Error('Korapay script timed out'))
    }, LOAD_TIMEOUT)

    const checkReady = () => {
      if (window.Korapay) {
        clearTimeout(timeoutId)
        loadingPromise = null
        resolve()
      } else if (Date.now() - startTime < LOAD_TIMEOUT) {
        setTimeout(checkReady, 100)
      } else {
        loadingPromise = null
        reject(new Error('Korapay script loaded but Korapay not found'))
      }
    }

    const startTime = Date.now()

    script.onload = () => {
      checkReady()
    }

    script.onerror = () => {
      clearTimeout(timeoutId)
      loadingPromise = null
      reject(new Error('Failed to load Korapay script'))
    }

    document.head.appendChild(script)
  })

  return loadingPromise
}

export async function initKorapayPayment(config: KorapayConfig): Promise<void> {
  if (!config.key) {
    throw new Error('Korapay public key is not configured')
  }
  await window.Korapay.initialize({
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
