import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  body?: string
}

export interface ModalAction {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'danger'
}

export interface PremiumNotification {
  id: string
  variant: 'success' | 'error' | 'warning' | 'info' | 'confirm'
  title: string
  message?: string
  duration?: number
  actions?: ModalAction[]
}

interface UIStore {
  sidebarOpen: boolean
  activeModal: string | null
  toasts: Toast[]
  theme: 'dark' | 'light'
  modalNotification: PremiumNotification | null
  toastNotifications: PremiumNotification[]
  setSidebarOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  toggleTheme: () => void
  setTheme: (theme: 'dark' | 'light') => void
  showModal: (notification: Omit<PremiumNotification, 'id'>) => void
  showNotification: (notification: Omit<PremiumNotification, 'id'>) => void
  dismissModal: () => void
}

let notifCounter = 0

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  toasts: [],
  theme: (typeof document !== 'undefined'
    ? (document.documentElement.getAttribute('data-theme') as 'dark' | 'light') ?? 'dark'
    : 'dark'),
  modalNotification: null,
  toastNotifications: [],

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveModal: (activeModal) => set({ activeModal }),

  showToast: (toast) =>
    set((state) => {
      const variant = toast.type as 'success' | 'error' | 'warning' | 'info'
      return {
        toasts: [...state.toasts, { ...toast, id: Date.now().toString() }],
        toastNotifications: [
          ...state.toastNotifications,
          { id: `toast_${++notifCounter}`, variant, title: toast.title, message: toast.body },
        ],
      }
    }),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
      toastNotifications: state.toastNotifications.filter((n) => n.id !== id),
    })),

  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', next)
      return { theme: next }
    }),

  setTheme: (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
    return { theme }
  },

  showModal: (notification) =>
    set({
      modalNotification: { ...notification, id: `modal_${++notifCounter}` },
    }),

  showNotification: (notification) =>
    set((state) => ({
      toastNotifications: [
        ...state.toastNotifications,
        { ...notification, id: `toast_${++notifCounter}` },
      ],
    })),

  dismissModal: () => set({ modalNotification: null }),
}))
