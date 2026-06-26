import { create } from 'zustand'

export type UserRole = 'planner' | 'coordinator' | 'vendor' | 'client' | 'team_member' | 'super_admin' | 'admin_monitor' | 'admin_support'

export interface Profile {
  id: string
  email: string
  display_name: string | null
  phone: string | null
  avatar_url: string | null
  role: UserRole
  org_id: string | null
  is_super_admin?: boolean
  original_role?: string | null
  is_active: boolean
  free_tier_used?: boolean
  referred_by_code?: string | null
  push_enabled?: boolean
  push_tasks?: boolean
  push_issues?: boolean
  push_vendors?: boolean
  push_payments?: boolean
  push_client_actions?: boolean
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, unknown>
}

interface AuthStore {
  user: AuthUser | null
  profile: Profile | null
  role: UserRole | null
  org: { id: string; name: string; logo_url: string | null; show_beta_label: boolean; owner_id?: string | null } | null
  betaLabelVisible: boolean
  isLoading: boolean
  setUser: (user: AuthUser | null) => void
  setProfile: (profile: Profile | null) => void
  setOrg: (org: { id: string; name: string; logo_url: string | null; show_beta_label: boolean; owner_id?: string | null } | null) => void
  setBetaLabelVisible: (visible: boolean) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

const ADMIN_ROLES = ['super_admin', 'admin_monitor', 'admin_support']

function deriveAdminRole(profile: { role: string | null; is_super_admin?: boolean } | null): UserRole | null {
  if (!profile?.is_super_admin) return null
  if (profile.role && ADMIN_ROLES.includes(profile.role)) return profile.role as UserRole
  return 'super_admin' as UserRole
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  role: null,
  org: null,
  betaLabelVisible: true,
  isLoading: true,
  setUser: (user) => set((state) => ({
    user,
    role: !user ? null : (deriveAdminRole(state.profile) || state.profile?.role || (user?.user_metadata?.role as UserRole)) ?? null,
  })),
  setProfile: (profile) => set((state) => ({
    profile,
    role: deriveAdminRole(profile) || (profile?.role || state.role || null),
  })),
  setOrg: (org) => set({ org }),
  setBetaLabelVisible: (betaLabelVisible) => set({ betaLabelVisible }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, role: null, org: null, betaLabelVisible: true, isLoading: false }),
}))
