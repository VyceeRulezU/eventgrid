import { create } from 'zustand'

interface PushNotificationStore {
  enabled: boolean
  supported: boolean
  permission: string
  setEnabled: (enabled: boolean) => void
  setSupported: (supported: boolean) => void
  setPermission: (permission: string) => void
}

export const usePushNotificationStore = create<PushNotificationStore>((set) => ({
  enabled: false,
  supported: false,
  permission: 'unavailable',
  setEnabled: (enabled) => set({ enabled }),
  setSupported: (supported) => set({ supported }),
  setPermission: (permission) => set({ permission }),
}))
