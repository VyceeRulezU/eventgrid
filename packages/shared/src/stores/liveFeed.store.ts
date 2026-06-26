import { create } from 'zustand'

export interface LiveFeedPost {
  id: string
  event_id: string
  user_id: string
  message: string
  photo_urls: string[]
  location_tag: string | null
  parent_id: string | null
  created_at: string
  likes_count?: number
}

export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface Issue {
  id: string
  event_id: string
  board_item_id: string | null
  title: string
  description: string | null
  severity: IssueSeverity
  photo_url: string | null
  raised_by: string
  raised_at: string
  resolved_at: string | null
  resolution: string | null
  resolved_by: string | null
  lessons_learned: string | null
  created_at: string
}

interface LiveFeedStore {
  posts: LiveFeedPost[]
  issues: Issue[]
  setPosts: (posts: LiveFeedPost[]) => void
  addPost: (post: LiveFeedPost) => void
  updatePost: (id: string, updates: Partial<LiveFeedPost>) => void
  setIssues: (issues: Issue[]) => void
  addIssue: (issue: Issue) => void
  resolveIssue: (id: string, resolution: string, resolvedBy: string) => void
}

export const useLiveFeedStore = create<LiveFeedStore>((set) => ({
  posts: [],
  issues: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({
    posts: state.posts.find((p) => p.id === post.id) ? state.posts : [...state.posts, post],
  })),
  updatePost: (id, updates) => set((state) => ({
    posts: state.posts.map((p) => p.id === id ? { ...p, ...updates } : p),
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
