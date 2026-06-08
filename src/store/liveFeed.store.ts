import { create } from 'zustand'
import type { LiveFeedPost, Issue } from '@/types'

interface LiveFeedStore {
  posts: LiveFeedPost[]
  issues: Issue[]
  setPosts: (posts: LiveFeedPost[]) => void
  addPost: (post: LiveFeedPost) => void
  setIssues: (issues: Issue[]) => void
  addIssue: (issue: Issue) => void
  resolveIssue: (id: string, resolution: string, resolvedBy: string) => void
}

export const useLiveFeedStore = create<LiveFeedStore>((set) => ({
  posts: [],
  issues: [],
  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({
    posts: state.posts.find((p) => p.id === post.id) ? state.posts : [post, ...state.posts],
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
