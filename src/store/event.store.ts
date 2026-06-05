import { create } from 'zustand'
import type { Event, EventPhase } from '@/types'

interface EventStore {
  activeEvent: Event | null
  events: Event[]
  phases: EventPhase[]
  setActiveEvent: (event: Event | null) => void
  setEvents: (events: Event[]) => void
  setPhases: (phases: EventPhase[]) => void
  updatePhase: (phaseId: string, data: Partial<EventPhase>) => void
}

export const useEventStore = create<EventStore>((set) => ({
  activeEvent: null,
  events: [],
  phases: [],
  setActiveEvent: (activeEvent) => set({ activeEvent }),
  setEvents: (events) => set({ events }),
  setPhases: (phases) => set({ phases }),
  updatePhase: (phaseId, data) =>
    set((state) => ({
      phases: state.phases.map((p) => (p.id === phaseId ? { ...p, ...data } : p)),
    })),
}))
