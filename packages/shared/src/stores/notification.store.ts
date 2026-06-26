import { create } from 'zustand'

export interface Notification {
  id: string
  user_id: string
  event_id: string | null
  type: string
  title: string
  body: string | null
  is_read: boolean
  read_at: string | null
  created_at: string
}

interface NotificationStore {
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  prependNotification: (n: Notification) => void
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.is_read).length,
    }),
  prependNotification: (n) =>
    set((state) => ({
      notifications: state.notifications.some((x) => x.id === n.id)
        ? state.notifications
        : [n, ...state.notifications],
    })),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  decrementUnread: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}))
