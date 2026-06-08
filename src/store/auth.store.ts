import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'

interface AuthStore {
  user: User | null
  profile: Profile | null
  role: UserRole | null
  org: { id: string; name: string; logo_url: string | null } | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setOrg: (org: { id: string; name: string; logo_url: string | null } | null) => void
  setLoading: (loading: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  profile: null,
  role: null,
  org: null,
  isLoading: true,
  setUser: (user) => set({
    user,
    role: (user?.user_metadata?.role as UserRole) ?? null,
  }),
  setProfile: (profile) => set((state) => ({
    profile,
    role: profile?.is_super_admin ? 'super_admin' as UserRole : (state.role || profile?.role || null),
  })),
  setOrg: (org) => set({ org }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, role: null, org: null, isLoading: false }),
}))
