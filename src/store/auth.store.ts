import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'
import { Sentry } from '@/lib/sentry'

interface AuthStore {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  org: { id: string; name: string; logo_url: string | null; show_beta_label: boolean; owner_id?: string | null } | null
  betaLabelVisible: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
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
  setUser: (user) => {
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email || undefined })
    } else {
      Sentry.setUser(null)
    }
    return set((state) => ({
      user,
      role: !user ? null : (deriveAdminRole(state.profile) || state.profile?.role || (user?.user_metadata?.role as UserRole)) ?? null,
    }))
  },
  setProfile: (profile) => set((state) => ({
    profile,
    role: deriveAdminRole(profile) || (profile?.role || state.role || null),
  })),
  setOrg: (org) => set({ org }),
  setBetaLabelVisible: (betaLabelVisible) => set({ betaLabelVisible }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => {
    Sentry.setUser(null)
    set({ user: null, profile: null, role: null, org: null, betaLabelVisible: true, isLoading: false })
  },
}))
