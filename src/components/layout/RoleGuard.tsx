import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import type { UserRole } from '@/types'
import type { ReactNode } from 'react'

interface RoleGuardProps {
  allowedRole: UserRole
  children: ReactNode
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const role = useAuthStore((s) => s.role)

  if (role === 'super_admin') return <>{children}</>

  if (role !== allowedRole) {
    if (role === 'team_member') {
      return <Navigate to="/dashboard/my-tasks" replace />
    }
    return <Navigate to={`/dashboard/${role}`} replace />
  }

  return <>{children}</>
}
