import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

interface AuthGuardProps {
  children: ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)
  const role = useAuthStore((s) => s.role)
  const isLoading = useAuthStore((s) => s.isLoading)
  const location = useLocation()

  if (isLoading || (user && !profile)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 56, height: 56, opacity: 0.5 }} />
        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>Loading NaliGrid...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isExempt = location.pathname.startsWith('/onboarding') || location.pathname === '/verify-email'

  if (!isExempt) {
    if (role === 'super_admin' || profile?.is_super_admin) {
      return <>{children}</>
    }
    const isCompleted = user.user_metadata?.onboarding_completed === true || !!profile?.org_id
    if (!isCompleted) {
      if (role === 'planner') {
        return <Navigate to="/onboarding/planner" replace />
      }
      if (role === 'coordinator') {
        return <Navigate to="/onboarding/coordinator" replace />
      }
    }
  }

  return <>{children}</>
}
