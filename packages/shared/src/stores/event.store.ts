import { create } from 'zustand'

export interface EventPhase {
  id: string
  event_id: string
  phase_number: number
  phase_name: string
  status: string
  owner_id: string | null
  due_date: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  org_id: string
  created_by: string
  name: string
  event_type: string
  event_date: string | null
  end_date: string | null
  venue_name: string | null
  venue_address: string | null
  guest_count: number | null
  size_tier: string | null
  budget_total: number | null
  status: string
  payment_status: string
  payment_provider: string | null
  amount_paid: number | null
  paid_at: string | null
  paystack_ref: string | null
  current_phase: number
  client_id: string | null
  coordinator_id: string | null
  notes: string | null
  slug: string | null
  header_image_url: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

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
