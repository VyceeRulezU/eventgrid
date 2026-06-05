import { create } from 'zustand'
import type { LiveBoardItem, Issue, LiveBoardStatus } from '@/types'

interface LiveBoardStore {
  items: LiveBoardItem[]
  issues: Issue[]
  setItems: (items: LiveBoardItem[]) => void
  updateItem: (id: string, status: LiveBoardStatus, statusLabel?: string) => void
  setIssues: (issues: Issue[]) => void
  addIssue: (issue: Issue) => void
  resolveIssue: (id: string, resolution: string, resolvedBy: string) => void
}

export const useLiveBoardStore = create<LiveBoardStore>((set) => ({
  items: [],
  issues: [],
  setItems: (items) => set({ items }),
  updateItem: (id, status, statusLabel) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, status, status_label: statusLabel ?? item.status_label } : item
      ),
    })),
  setIssues: (issues) => set({ issues }),
  addIssue: (issue) => set((state) => ({ issues: [...state.issues, issue] })),
  resolveIssue: (id, resolution, resolvedBy) =>
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id
          ? { ...issue, resolved_at: new Date().toISOString(), resolution, resolved_by: resolvedBy }
          : issue
      ),
    })),
}))
