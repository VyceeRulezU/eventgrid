import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role === 'super_admin'

  if (!role) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  return <>{children}</>
}
