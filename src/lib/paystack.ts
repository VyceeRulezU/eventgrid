const SCRIPT_URL = 'https://js.paystack.co/v1/inline.js'
const LOAD_TIMEOUT = 15000

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

function getExistingScript(): HTMLScriptElement | null {
  return document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`)
}

export function loadPaystackScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = getExistingScript()
    if (existing && window.PaystackPop) {
      resolve()
      return
    }
    if (existing && !window.PaystackPop) {
      existing.remove()
    }

    const script = document.createElement('script')
    script.src = SCRIPT_URL
    script.async = true

    const timeoutId = setTimeout(() => {
      script.onload = null
      script.onerror = null
      reject(new Error('Paystack script timed out'))
    }, LOAD_TIMEOUT)

    script.onload = () => {
      clearTimeout(timeoutId)
      if (window.PaystackPop) {
        resolve()
      } else {
        reject(new Error('Paystack script loaded but PaystackPop not found'))
      }
    }

    script.onerror = () => {
      clearTimeout(timeoutId)
      reject(new Error('Failed to load Paystack script'))
    }

    document.head.appendChild(script)
  })
}

export function initPaystackPayment(config: PaystackConfig): void {
  if (!window.PaystackPop) {
    throw new Error('PaystackPop not available. Call loadPaystackScript() first.')
  }
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
