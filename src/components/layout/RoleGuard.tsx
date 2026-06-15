import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { ReactNode } from 'react'

interface RoleGuardProps {
  allowedRole: string | string[]
  children: ReactNode
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const role = useAuthStore((s) => s.role)

  if (role === 'super_admin') return <>{children}</>

  if (!role) {
    return <Navigate to="/" replace />
  }

  const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole]

  if (!roles.includes(role)) {
    if (role === 'team_member') {
      return <Navigate to="/dashboard/my-tasks" replace />
    }
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  return <>{children}</>
}
