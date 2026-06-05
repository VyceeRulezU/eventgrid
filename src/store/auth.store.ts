import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'

function detectSuperAdmin(user: User | null): UserRole | null {
  if (!user?.email) return null
  const superEmails = (import.meta.env.VITE_SUPER_ADMIN_EMAILS as string | undefined) || ''
  const emails = superEmails.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  if (emails.includes(user.email.toLowerCase())) return 'super_admin'
  return null
}

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
    role: detectSuperAdmin(user) || ((user?.user_metadata?.role as UserRole) ?? null),
  }),
  setProfile: (profile) => set({ profile }),
  setOrg: (org) => set({ org }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null, role: null, org: null, isLoading: false }),
}))
