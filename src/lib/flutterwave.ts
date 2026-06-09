export interface FlutterwaveConfig {
  public_key: string
  tx_ref: string
  amount: number
  currency: string
  email: string
  phone_number?: string
  name?: string
  meta?: Record<string, unknown>
  onSuccess: (response: { transaction_id: string; tx_ref: string }) => void
  onClose: () => void
}

declare global {
  interface Window {
    FlutterwaveCheckout: (config: {
      public_key: string
      tx_ref: string
      amount: number
      currency: string
      customer: {
        email: string
        phone_number?: string
        name?: string
      }
      meta?: Record<string, unknown>
      callback: (response: { transaction_id: string; tx_ref: string; status: string }) => void
      onclose: () => void
    }) => void
  }
}

export function loadFlutterwaveScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="flutterwave"]')) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.flutterwave.com/v3.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Flutterwave script'))
    document.head.appendChild(script)
  })
}

export function initFlutterwavePayment(config: FlutterwaveConfig): void {
  window.FlutterwaveCheckout({
    public_key: config.public_key,
    tx_ref: config.tx_ref,
    amount: config.amount,
    currency: config.currency,
    customer: {
      email: config.email,
      phone_number: config.phone_number,
      name: config.name,
    },
    meta: config.meta as Record<string, unknown>,
    callback: (response) => {
      if (response.status === 'successful' || response.status === 'completed') {
        config.onSuccess(response)
      }
    },
    onclose: () => config.onClose(),
  })
}
