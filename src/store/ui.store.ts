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
  sidebarCollapsed: boolean
  activeModal: string | null
  toasts: Toast[]
  theme: 'dark'
  modalNotification: PremiumNotification | null
  toastNotifications: PremiumNotification[]
  setSidebarOpen: (open: boolean) => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveModal: (modal: string | null) => void
  showToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: string) => void
  toggleTheme: () => void
  setTheme: (theme: 'dark') => void
  showModal: (notification: Omit<PremiumNotification, 'id'>) => void
  showNotification: (notification: Omit<PremiumNotification, 'id'>) => void
  dismissModal: () => void
  playSound: (type?: 'success' | 'error' | 'warning' | 'info' | 'confirm') => void
}

function playNotificationSound(type?: 'success' | 'error' | 'warning' | 'info' | 'confirm') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()

    // Resume if suspended (browsers require user gesture, but some allow it after first interaction)
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const now = ctx.currentTime

    const playTone = (
      freq: number,
      start: number,
      duration: number,
      vol: number,
      wave: OscillatorType = 'triangle'
    ) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = wave
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(vol, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(start)
      osc.stop(start + duration)
    }

    if (type === 'error') {
      playTone(220.00, now, 0.3, 0.2, 'sawtooth')
      playTone(207.65, now + 0.12, 0.4, 0.15, 'sawtooth')
    } else if (type === 'warning') {
      playTone(587.33, now, 0.15, 0.2)
      playTone(587.33, now + 0.12, 0.25, 0.2)
    } else if (type === 'success') {
      playTone(523.25, now, 0.12, 0.2)
      playTone(659.25, now + 0.1, 0.12, 0.2)
      playTone(783.99, now + 0.2, 0.25, 0.18)
    } else {
      // info / confirm / default — single ascending double-beep
      playTone(659.25, now, 0.08, 0.18)
      playTone(783.99, now + 0.1, 0.15, 0.18)
    }

    // Vibrate on supported devices — different patterns per type
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (type) {
        case 'error':
          navigator.vibrate([200, 100, 200])
          break
        case 'warning':
          navigator.vibrate([100, 50, 100, 50, 100])
          break
        case 'success':
          navigator.vibrate([80, 40, 80])
          break
        default:
          navigator.vibrate([60, 30, 60])
      }
    }
  } catch (e) {
    console.warn('Notification sound/vibration failed:', e)
  }
}

let notifCounter = 0

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  sidebarCollapsed: false,
  activeModal: null,
  toasts: [],
  theme: 'dark',
  modalNotification: null,
  toastNotifications: [],

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  toggleSidebarCollapsed: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setActiveModal: (activeModal) => set({ activeModal }),

  showToast: (toast) => {
    set((state) => {
      const variant = toast.type as 'success' | 'error' | 'warning' | 'info'
      return {
        toasts: [...state.toasts, { ...toast, id: Date.now().toString() }],
        toastNotifications: [
          ...state.toastNotifications,
          { id: `toast_${++notifCounter}`, variant, title: toast.title, message: toast.body },
        ],
      }
    })
  },

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
      toastNotifications: state.toastNotifications.filter((n) => n.id !== id),
    })),

  toggleTheme: () => undefined,

  setTheme: () => undefined,

  showModal: (notification) => {
    set({
      modalNotification: { ...notification, id: `modal_${++notifCounter}` },
    })
  },

  showNotification: (notification) => {
    set((state) => ({
      toastNotifications: [
        ...state.toastNotifications,
        { ...notification, id: `toast_${++notifCounter}` },
      ],
    }))
  },

  dismissModal: () => set({ modalNotification: null }),

  playSound: (type) => {
    playNotificationSound(type)
  },
}))
