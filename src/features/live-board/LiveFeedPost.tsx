import { useState } from 'react'
import { MapPin, Clock, Flag, User } from 'lucide-react'
import { IssueForm } from './IssueForm'
import type { LiveFeedPost as LiveFeedPostType } from '@/types'
import styles from './LiveBoardPage.module.css'

interface LiveFeedPostProps {
  post: LiveFeedPostType
  eventId: string
  displayName?: string | null
  avatarUrl?: string | null
}

export function LiveFeedPost({ post, eventId, displayName, avatarUrl }: LiveFeedPostProps) {
  const [showIssueForm, setShowIssueForm] = useState(false)
  const photos: string[] = Array.isArray(post.photo_urls)
    ? post.photo_urls
    : typeof post.photo_urls === 'string'
      ? JSON.parse(post.photo_urls)
      : []

  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  })()

  return (
    <>
      <div className={styles.feedPost}>
        <div className={styles.feedPostAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={styles.feedPostAvatarImg} />
          ) : (
            <div className={styles.feedPostAvatarPlaceholder}>
              <User size={16} />
            </div>
          )}
        </div>

        <div className={styles.feedPostBody}>
          <div className={styles.feedPostHeader}>
            <span className={styles.feedPostAuthor}>{displayName || post.user_id.slice(0, 8)}</span>
            <span className={styles.feedPostTime}>
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>

          <div className={styles.feedPostMessage}>{post.message}</div>

          {photos.length > 0 && (
            <div className={styles.feedPostPhotos} data-count={Math.min(photos.length, 4)}>
              {photos.slice(0, 4).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.feedPostPhotoLink}>
                  <img src={url} alt="" className={styles.feedPostPhoto} />
                </a>
              ))}
              {photos.length > 4 && (
                <div className={styles.feedPostPhotoMore}>+{photos.length - 4}</div>
              )}
            </div>
          )}

          <div className={styles.feedPostFooter}>
            {post.location_tag && (
              <span className={styles.feedPostLocation}>
                <MapPin size={12} />
                {post.location_tag}
              </span>
            )}
            <button className={styles.feedPostFlagBtn} onClick={() => setShowIssueForm(true)}>
              <Flag size={12} />
              Flag Issue
            </button>
          </div>
        </div>
      </div>

      {showIssueForm && (
        <div className={styles.modalOverlay} onClick={() => setShowIssueForm(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <IssueForm eventId={eventId} onClose={() => setShowIssueForm(false)} />
          </div>
        </div>
      )}
    </>
  )
}
