import { loadPaystackScript, initPaystackPayment } from './paystack'
import { loadFlutterwaveScript, initFlutterwavePayment } from './flutterwave'

export type PaymentProvider = 'paystack' | 'flutterwave'

export interface PaymentConfig {
  provider: PaymentProvider
  email: string
  amount: number
  metadata: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
}

export function getEventPrice(_sizeTier: string): number {
  return 2000000
}

export async function processPayment(config: PaymentConfig): Promise<void> {
  if (config.provider === 'paystack') {
    await loadPaystackScript()
    initPaystackPayment({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email: config.email,
      amount: config.amount,
      metadata: config.metadata,
      onSuccess: config.onSuccess,
      onClose: config.onClose,
    })
  } else if (config.provider === 'flutterwave') {
    await loadFlutterwaveScript()
    initFlutterwavePayment({
      public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
      tx_ref: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: config.amount / 100,
      currency: 'NGN',
      email: config.email,
      meta: config.metadata as Record<string, unknown>,
      onSuccess: (response) => config.onSuccess(response.transaction_id),
      onClose: () => config.onClose(),
    })
  }
}
