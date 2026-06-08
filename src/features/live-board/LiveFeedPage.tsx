import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { supabase } from '@/lib/supabase'
import { useLiveFeedStore } from '@/store/liveFeed.store'
import { PostForm } from './PostForm'
import { LiveFeedPost } from './LiveFeedPost'
import { IssuesPanel } from './IssuesPanel'
import { ArrowLeft, LayoutDashboard, Clock, Radio, MessageSquare } from 'lucide-react'
import { PageHero } from '@/components/shared/PageHero'
import type { LiveFeedPost as LiveFeedPostType, Issue } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import styles from './LiveBoardPage.module.css'

interface ProfileInfo {
  display_name: string | null
  avatar_url: string | null
}

export function LiveFeedPage() {
  const { eventId, paramId } = useResolvedEventId()
  const navigate = useNavigate()
  const { posts, setPosts, addPost, issues, setIssues, addIssue } = useLiveFeedStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({})
  const [showIssues, setShowIssues] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)

  const loadProfiles = useCallback(async (userIds: string[]) => {
    const unique = [...new Set(userIds)]
    const cached = new Set(Object.keys(profiles))
    const missing = unique.filter((id) => !cached.has(id))
    if (missing.length === 0) return

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', missing)

    if (data) {
      setProfiles((prev) => {
        const next = { ...prev }
        data.forEach((p) => {
          next[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
        })
        return next
      })
    }
  }, [profiles])

  useEffect(() => {
    if (!eventId) return

    async function loadData() {
      setLoading(true)
      setError(null)

      const [postsRes, issuesRes] = await Promise.all([
        supabase.from('live_feed_posts').select('*').eq('event_id', eventId).order('created_at', { ascending: false }),
        supabase.from('issues').select('*').eq('event_id', eventId),
      ])

      if (postsRes.error) {
        setError(postsRes.error.message)
        setLoading(false)
        return
      }
      if (issuesRes.error) {
        setError(issuesRes.error.message)
        setLoading(false)
        return
      }

      const postsData = postsRes.data as unknown as LiveFeedPostType[]
      const issuesData = issuesRes.data as unknown as Issue[]

      setPosts(postsData)
      setIssues(issuesData)

      const userIds = [
        ...new Set([
          ...postsData.map((p) => p.user_id),
          ...issuesData.map((i) => i.raised_by).filter(Boolean),
        ]),
      ]
      await loadProfiles(userIds)

      setLoading(false)
    }

    loadData()

    const feedChannel = supabase.channel('live_feed:' + eventId)
    feedChannel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_feed_posts',
        filter: 'event_id=eq.' + eventId,
      }, async (payload: any) => {
        if (payload.new) {
          const post = payload.new as LiveFeedPostType
          addPost(post)
          await loadProfiles([post.user_id])
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'issues',
        filter: 'event_id=eq.' + eventId,
      }, (payload: any) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          addIssue(payload.new as unknown as Issue)
        }
      })
      .subscribe()

    channelRef.current = feedChannel

    return () => {
      feedChannel.unsubscribe()
    }
  }, [eventId])

  const programTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const openIssues = issues.filter((i) => !i.resolved_at).length

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <img src="/EventGrid-favicon.svg" alt="Loading" className={styles.loadingImg} />
          <div className={styles.loadingText}>Loading live feed...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">
          <LayoutDashboard size={24} />
        </div>
        <div className="empty-state__title">Failed to load feed</div>
        <div className="empty-state__description">{error}</div>
        <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => navigate(`/events/${paramId}`)}>
          <ArrowLeft size={16} />
          Back to Event
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHero
        icon={Radio}
        title="Live Feed"
        subtitle="Real-time event updates from the team"
        backTo={`/events/${paramId}`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div className={styles.clockBadge}>
              <Clock size={16} className={styles.clockIcon} />
              {programTime}
            </div>
            <button
              className={`btn btn-ghost btn-sm ${styles.issuesToggleBtn}`}
              style={{ borderRadius: 'var(--radius-sm)', position: 'relative' }}
              onClick={() => setShowIssues(!showIssues)}
            >
              <MessageSquare size={16} />
              Issues
              {openIssues > 0 && <span className={styles.issuesBadge}>{openIssues}</span>}
            </button>
          </div>
        }
      />

      <div className={styles.feedLayout}>
        <div className={styles.feedMain}>
          <PostForm eventId={eventId!} />

          {posts.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-8) var(--space-4)' }}>
              <div className="empty-state__icon">
                <Radio size={20} />
              </div>
              <div className="empty-state__title">No updates yet</div>
              <div className="empty-state__description">
                Post the first update to start the live feed
              </div>
            </div>
          ) : (
            <div className={styles.feedTimeline}>
              {posts.map((post) => (
                <LiveFeedPost
                  key={post.id}
                  post={post}
                  eventId={eventId!}
                  displayName={profiles[post.user_id]?.display_name}
                  avatarUrl={profiles[post.user_id]?.avatar_url}
                />
              ))}
            </div>
          )}
        </div>

        {showIssues && (
          <div className={styles.feedSidebar}>
            <IssuesPanel eventId={eventId!} />
          </div>
        )}
      </div>
    </div>
  )
}
