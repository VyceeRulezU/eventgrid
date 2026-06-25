import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

interface AdminGuardProps {
  children: ReactNode
}

const ADMIN_ROLES: string[] = ['super_admin', 'admin_monitor', 'admin_support']

export function AdminGuard({ children }: AdminGuardProps) {
  const role = useAuthStore((s) => s.role)
  const isAdmin = role && ADMIN_ROLES.includes(role)

  if (!role) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  return <>{children}</>
}
