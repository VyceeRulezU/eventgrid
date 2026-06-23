import { useEffect, useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useResolvedEventId } from '@/hooks/useResolvedEventId'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
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

interface TeamMember {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export function LiveFeedPage() {
  const { eventId, paramId } = useResolvedEventId()
  const navigate = useNavigate()
  const { posts, setPosts, addPost, issues, setIssues, addIssue } = useLiveFeedStore()
  const currentUser = useAuthStore((s) => s.user)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [profileMap, setProfileMap] = useState<Record<string, ProfileInfo>>({})
  const [showIssues, setShowIssues] = useState(false)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  const channelRef = useRef<RealtimeChannel | null>(null)
  const profileRef = useRef<Record<string, ProfileInfo>>({})
  const timelineRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: 'smooth' })
    })
  }

  async function ensureProfiles(userIds: string[]) {
    const unique = [...new Set(userIds)]
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', unique)

    if (data) {
      data.forEach((p) => {
        profileRef.current[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      })
      setProfileMap({ ...profileRef.current })
    }
  }

  async function loadTeamMembers() {
    if (!eventId) return
    const { data: eaData } = await supabase
      .from('event_access')
      .select('user_id')
      .eq('event_id', eventId)

    if (!eaData || eaData.length === 0) return

    const userIds = [...new Set(eaData.map((r) => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds)

    if (profiles) {
      setTeamMembers(
        profiles.map((p) => ({
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }))
      )
      profiles.forEach((p) => {
        profileRef.current[p.id] = { display_name: p.display_name, avatar_url: p.avatar_url }
      })
      setProfileMap({ ...profileRef.current })
    }
  }

  const topLevelPosts = useMemo(() => posts.filter((p) => !p.parent_id), [posts])

  const getReplies = (postId: string) =>
    posts.filter((p) => p.parent_id === postId).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

  const getParentPost = (parentId: string) => posts.find((p) => p.id === parentId)

  useEffect(() => {
    if (!eventId) return
    supabase.from('events').select('name').eq('id', eventId).single().then(({ data }) => { if (data) setEventName(data.name) })

    async function loadData() {
      setLoading(true)
      setError(null)

      const [postsRes, issuesRes] = await Promise.all([
        supabase.from('live_feed_posts').select('*').eq('event_id', eventId).order('created_at', { ascending: true }),
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
          ...(currentUser ? [currentUser.id] : []),
        ]),
      ]
      await ensureProfiles(userIds)

      setLoading(false)
      scrollToBottom()
    }

    loadData()
    loadTeamMembers()

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
          await ensureProfiles([post.user_id])
          addPost(post)
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

  useEffect(() => {
    scrollToBottom()
  }, [posts.length])

  const programTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const openIssues = issues.filter((i) => !i.resolved_at).length

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <img src="/ng-new-logo.png" alt="Loading" className={styles.loadingImg} />
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
        title={`Live Feed${eventName ? ` | ${eventName}` : ''}`}
        subtitle="Real-time event updates from the team"
        backTo={`/events/${paramId}`}
        actions={
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            <div className={`${styles.clockBadge} ${styles.hideMobile}`}>
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

      <div className={`${styles.feedLayout} ${!showIssues ? styles.feedLayoutFull : ''}`}>
        <div className={styles.feedMain}>
          <div className={styles.feedTimeline} ref={timelineRef}>
            {topLevelPosts.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--space-10) var(--space-4)' }}>
                <div className="empty-state__icon">
                  <Radio size={20} />
                </div>
                <div className="empty-state__title">No updates yet</div>
                <div className="empty-state__description">
                  Post the first update to start the live feed
                </div>
              </div>
            ) : (
              topLevelPosts.map((post) => (
                <LiveFeedPost
                  key={post.id}
                  post={post}
                  replies={getReplies(post.id)}
                  eventId={eventId!}
                  displayName={profileMap[post.user_id]?.display_name}
                  avatarUrl={profileMap[post.user_id]?.avatar_url}
                  profileMap={profileMap}
                  teamMembers={teamMembers}
                  getParentPost={getParentPost}
                />
              ))
            )}
          </div>

          <PostForm eventId={eventId!} teamMembers={teamMembers} />
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
