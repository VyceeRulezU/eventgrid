import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2, AlertCircle } from 'lucide-react'

export function InviteAccept() {
  const [params] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const link = params.get('link')
    if (!link) {
      setError('Missing invite link.')
      return
    }
    try {
      const decoded = decodeURIComponent(link)
      window.location.replace(decoded)
    } catch {
      setError('Invalid invite link.')
    }
  }, [params])

  if (error) {
    return (
      <div className="page-center">
        <div className="card" style={{ padding: 'var(--space-6)', textAlign: 'center', maxWidth: 400 }}>
          <AlertCircle size={32} style={{ color: 'var(--color-error)', marginBottom: 'var(--space-3)' }} />
          <h2>Invalid Invitation</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 'var(--space-2)' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-center">
      <div style={{ textAlign: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: 'var(--color-accent)' }} />
        <p style={{ marginTop: 'var(--space-3)', color: 'var(--color-text-secondary)' }}>Verifying your invitation…</p>
      </div>
    </div>
  )
}
