export interface PaystackConfig {
  key: string
  email: string
  amount: number
  metadata: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
}

export interface PaystackInstance {
  openIframe: () => void
}

declare global {
  interface Window {
    PaystackPop: {
      setup: (config: {
        key: string
        email: string
        amount: number
        metadata?: Record<string, unknown>
        callback: (response: { reference: string }) => void
        onClose: () => void
      }) => PaystackInstance
    }
  }
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="paystack"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.paystack.co/v1/inline.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Paystack script'))
    document.head.appendChild(script)
  })
}

export function initPaystackPayment(config: PaystackConfig): void {
  const handler = window.PaystackPop.setup({
    key: config.key,
    email: config.email,
    amount: config.amount,
    metadata: config.metadata as Record<string, unknown>,
    callback: (response) => config.onSuccess(response.reference),
    onClose: () => config.onClose(),
  })
  handler.openIframe()
}
