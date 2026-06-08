import { create } from 'zustand'

interface PushNotificationStore {
  enabled: boolean
  supported: boolean
  permission: NotificationPermission | 'unavailable'
  setEnabled: (enabled: boolean) => void
  setSupported: (supported: boolean) => void
  setPermission: (permission: NotificationPermission | 'unavailable') => void
}

export const usePushNotificationStore = create<PushNotificationStore>((set) => ({
  enabled: false,
  supported: false,
  permission: 'unavailable',
  setEnabled: (enabled) => set({ enabled }),
  setSupported: (supported) => set({ supported }),
  setPermission: (permission) => set({ permission }),
}))
