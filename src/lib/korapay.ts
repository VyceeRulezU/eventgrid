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

export function loadKorapayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="korapay-collections"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Korapay script'))
    document.head.appendChild(script)
  })
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
