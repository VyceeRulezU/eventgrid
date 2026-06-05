import { create } from 'zustand'
import type { Notification } from '@/types'

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  drawerOpen: boolean
  setNotifications: (notifications: Notification[]) => void
  prependNotification: (n: Notification) => void
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
  setDrawerOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  drawerOpen: false,

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),

  prependNotification: (n) =>
    set((state) => ({
      notifications: [n, ...state.notifications],
      unreadCount: state.unreadCount + (n.is_read ? 0 : 1),
    })),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  setDrawerOpen: (drawerOpen) => set({ drawerOpen }),
}))
