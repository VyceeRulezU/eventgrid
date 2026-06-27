import { useState } from 'react'
import { MapPin, Clock, Flag, User, FileText, ExternalLink, X, ChevronLeft, ChevronRight, MessageCircle, Heart } from 'lucide-react'
import { IssueForm } from './IssueForm'
import { PostForm } from './PostForm'
import type { LiveFeedPost as LiveFeedPostType } from '@/types'
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

interface LiveFeedPostProps {
  post: LiveFeedPostType
  getReplies: (postId: string) => LiveFeedPostType[]
  eventId: string
  displayName?: string | null
  avatarUrl?: string | null
  profileMap: Record<string, ProfileInfo>
  teamMembers: TeamMember[]
  getParentPost: (parentId: string) => LiveFeedPostType | undefined
  isReply?: boolean
  likedByUser?: boolean
  onToggleLike?: (postId: string) => void
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('pdf')
}

function calcTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

/** Single post row — shared by parent + replies */
function PostRow({
  post,
  displayName,
  avatarUrl,
  isReply,
  showThreadLine,
  likedByUser,
  onToggleLike,
  onReply,
  onFlag,
}: {
  post: LiveFeedPostType
  displayName?: string | null
  avatarUrl?: string | null
  isReply?: boolean
  showThreadLine?: boolean  // draw line below avatar (parent with replies)
  likedByUser?: boolean
  onToggleLike?: (id: string) => void
  onReply?: () => void
  onFlag?: () => void
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const photos: string[] = Array.isArray(post.photo_urls)
    ? post.photo_urls
    : typeof post.photo_urls === 'string'
      ? JSON.parse(post.photo_urls)
      : []

  const imagePhotos = photos.filter((u) => !isPdfUrl(u))
  const pdfPhotos = photos.filter((u) => isPdfUrl(u))
  const authorName = displayName || 'User'
  const timeAgo = calcTimeAgo(post.created_at)
  const avatarSize = isReply ? 32 : 40

  return (
    <>
      <div className={`${styles.xPost} ${isReply ? styles.xPostReply : ''}`}>
        {/* Left: Avatar + thread line */}
        <div className={styles.xAvatarCol}>
          <div className={styles.xAvatar} style={{ width: avatarSize, height: avatarSize }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className={styles.xAvatarImg} />
            ) : (
              <div className={styles.xAvatarPlaceholder} style={{ width: avatarSize, height: avatarSize }}>
                <User size={isReply ? 14 : 18} />
              </div>
            )}
          </div>
          {/* Thread line below avatar — shown when this post has replies being displayed */}
          {showThreadLine && <div className={styles.xThreadLine} />}
        </div>

        {/* Right: Body */}
        <div className={styles.xBody}>
          {/* Header row */}
          <div className={styles.xHeader}>
            <span className={styles.xAuthor}>{authorName}</span>
            <span className={styles.xTime}>
              <Clock size={11} />
              {timeAgo}
            </span>
          </div>

          {/* Message */}
          <div className={styles.xMessage}>{post.message}</div>

          {/* Image grid */}
          {imagePhotos.length > 0 && (
            <div className={styles.xPhotos} data-count={Math.min(imagePhotos.length, 4)}>
              {imagePhotos.slice(0, 4).map((url, i) => (
                <button key={i} className={styles.xPhotoBtn} onClick={() => setLightboxIdx(i)}>
                  <img src={url} alt="" className={styles.xPhoto} />
                  {imagePhotos.length > 4 && i === 3 && (
                    <div className={styles.xPhotoMore}>+{imagePhotos.length - 4}</div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* PDF attachments */}
          {pdfPhotos.length > 0 && (
            <div className={styles.xPdfGrid}>
              {pdfPhotos.map((url, i) => (
                <button key={i} className={styles.xPdfCard} onClick={() => setPdfPreviewUrl(url)}>
                  <FileText size={20} />
                  <span className={styles.xPdfName}>PDF {i + 1}</span>
                  <ExternalLink size={11} />
                </button>
              ))}
            </div>
          )}

          {/* Actions row */}
          <div className={styles.xActions}>
            <button
              className={`${styles.xActionBtn} ${likedByUser ? styles.xActionBtnLiked : ''}`}
              onClick={() => onToggleLike?.(post.id)}
            >
              <Heart size={14} fill={likedByUser ? 'currentColor' : 'none'} />
              {(post.likes_count || 0) > 0 && <span>{post.likes_count}</span>}
            </button>

            {post.location_tag && (
              <span className={styles.xLocation}>
                <MapPin size={12} />
                {post.location_tag}
              </span>
            )}

            <button className={styles.xActionBtn} onClick={onReply}>
              <MessageCircle size={14} />
              {!isReply && <span>Reply</span>}
            </button>

            <button className={`${styles.xActionBtn} ${styles.xFlagBtn}`} onClick={onFlag}>
              <Flag size={14} />
              <span className={styles.xFlagLabel}>Flag</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxIdx(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightboxIdx(null)}>
              <X size={20} />
            </button>
            {imagePhotos.length > 1 && (
              <>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={() => setLightboxIdx((p) => p === null ? 0 : (p - 1 + imagePhotos.length) % imagePhotos.length)}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={() => setLightboxIdx((p) => p === null ? 0 : (p + 1) % imagePhotos.length)}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <img src={imagePhotos[lightboxIdx]} alt="" className={styles.lightboxImage} />
            <div className={styles.lightboxCounter}>{lightboxIdx + 1} / {imagePhotos.length}</div>
          </div>
        </div>
      )}

      {/* PDF preview */}
      {pdfPreviewUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setPdfPreviewUrl(null)}>
          <div className={styles.pdfPreviewContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setPdfPreviewUrl(null)}>
              <X size={20} />
            </button>
            <iframe src={pdfPreviewUrl} className={styles.pdfPreviewIframe} title="PDF Preview" />
            <a href={pdfPreviewUrl} target="_blank" rel="noopener noreferrer" className={styles.pdfPreviewOpenBtn}>
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        </div>
      )}
    </>
  )
}

/** Main exported component — handles parent + its replies as an X-style thread group */
export function LiveFeedPost({ post, getReplies, eventId, displayName, avatarUrl, profileMap, teamMembers, isReply, likedByUser, onToggleLike }: LiveFeedPostProps) {
  const childReplies = getReplies(post.id)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [repliesExpanded, setRepliesExpanded] = useState(false)

  // Only top-level posts manage their own reply threads
  if (isReply) {
    // Replies render as slim PostRows — no sub-threading shown
    return (
      <PostRow
        post={post}
        displayName={displayName}
        avatarUrl={avatarUrl}
        isReply
        likedByUser={likedByUser}
        onToggleLike={onToggleLike}
        onFlag={() => setShowIssueForm(true)}
        onReply={() => {}} // replies to replies not shown inline
      />
    )
  }

  // ----- Top-level thread group -----
  const hasReplies = childReplies.length > 0
  const showThreadLine = hasReplies && repliesExpanded

  return (
    <>
      <div className={styles.xThreadGroup}>
        {/* Parent post */}
        <PostRow
          post={post}
          displayName={displayName}
          avatarUrl={avatarUrl}
          showThreadLine={showThreadLine}
          likedByUser={likedByUser}
          onToggleLike={onToggleLike}
          onFlag={() => setShowIssueForm(true)}
          onReply={() => setShowReplyForm((v) => !v)}
        />

        {/* Inline reply composer (shows when user hits Reply) */}
        {showReplyForm && !hasReplies && (
          <div className={styles.xInlineReply}>
            <PostForm
              eventId={eventId}
              parentId={post.id}
              parentAuthorName={displayName || 'User'}
              teamMembers={teamMembers}
              onSuccess={() => setShowReplyForm(false)}
              compact
            />
          </div>
        )}

        {/* Expand/collapse pill — only shown when there are replies */}
        {hasReplies && (
          <button
            className={styles.xShowRepliesBtn}
            onClick={() => {
              setRepliesExpanded((v) => !v)
              setShowReplyForm(false)
            }}
          >
            <MessageCircle size={13} />
            {repliesExpanded
              ? 'Hide replies'
              : `Show ${childReplies.length} repl${childReplies.length === 1 ? 'y' : 'ies'}`}
          </button>
        )}

        {/* Expanded replies — flat, single-level */}
        {repliesExpanded && (
          <div className={styles.xRepliesBlock}>
            {childReplies.map((reply) => (
              <div key={reply.id} className={styles.xReplyRow}>
                <PostRow
                  post={reply}
                  displayName={profileMap[reply.user_id]?.display_name}
                  avatarUrl={profileMap[reply.user_id]?.avatar_url}
                  isReply
                  likedByUser={likedByUser}
                  onToggleLike={onToggleLike}
                  onFlag={() => setShowIssueForm(true)}
                  onReply={() => setShowReplyForm(true)}
                />
              </div>
            ))}
            {/* Reply composer attached to thread */}
            {showReplyForm && (
              <div className={styles.xInlineReply}>
                <PostForm
                  eventId={eventId}
                  parentId={post.id}
                  parentAuthorName={displayName || 'User'}
                  teamMembers={teamMembers}
                  onSuccess={() => { setShowReplyForm(false) }}
                  compact
                />
              </div>
            )}
            <button
              className={styles.xReplyToThreadBtn}
              onClick={() => setShowReplyForm((v) => !v)}
            >
              <MessageCircle size={13} />
              {showReplyForm ? 'Cancel' : 'Reply to thread'}
            </button>
          </div>
        )}
      </div>

      {/* Issue Flag modal */}
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
