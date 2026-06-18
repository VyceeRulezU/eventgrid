import { loadPaystackScript, initPaystackPayment } from './paystack'
import { loadKorapayScript, initKorapayPayment } from './korapay'

export type PaymentProvider = 'paystack' | 'korapay'

export interface PaymentConfig {
  provider: PaymentProvider
  email: string
  amount: number
  metadata: Record<string, unknown>
  onSuccess: (reference: string) => void
  onClose: () => void
  onFailed?: (message: string) => void
}

export function getEventPrice(_sizeTier: string): number {
  return 2000000
}

export async function processPayment(config: PaymentConfig): Promise<void> {
  if (config.provider === 'paystack') {
    const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
    if (!key) throw new Error('Paystack public key is not configured')
    await loadPaystackScript()
    initPaystackPayment({
      key,
      email: config.email,
      amount: config.amount,
      metadata: config.metadata,
      onSuccess: config.onSuccess,
      onClose: config.onClose,
    })
  } else if (config.provider === 'korapay') {
    const key = import.meta.env.VITE_KORAPAY_PUBLIC_KEY
    if (!key) throw new Error('Korapay public key is not configured')
    await loadKorapayScript()
    await initKorapayPayment({
      key,
      reference: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      amount: config.amount / 100,
      currency: 'NGN',
      email: config.email,
      customerName: (config.metadata?.customer_name as string) || undefined,
      metadata: config.metadata as Record<string, unknown>,
      onSuccess: (data) => config.onSuccess(data.reference),
      onClose: () => config.onClose(),
      onFailed: (data) => config.onFailed?.(data.status || 'Payment verification failed at gateway'),
    })
  }
}
