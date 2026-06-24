import { useState } from 'react'
import { MapPin, Clock, Flag, User, FileText, ExternalLink, X, ChevronLeft, ChevronRight, ChevronDown, MessageCircle, Heart } from 'lucide-react'
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
  depth?: number
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
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const MAX_DEPTH = 5

export function LiveFeedPost({ post, getReplies, eventId, displayName, avatarUrl, profileMap, teamMembers, getParentPost, isReply, depth = 0, likedByUser, onToggleLike }: LiveFeedPostProps) {
  const childReplies = getReplies(post.id)
  const [collapsed, setCollapsed] = useState(false)
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

  const photos: string[] = Array.isArray(post.photo_urls)
    ? post.photo_urls
    : typeof post.photo_urls === 'string'
      ? JSON.parse(post.photo_urls)
      : []

  const timeAgo = calcTimeAgo(post.created_at)
  const authorName = displayName || 'User'

  const imagePhotos = photos.filter((u) => !isPdfUrl(u))
  const pdfPhotos = photos.filter((u) => isPdfUrl(u))

  const handlePdfClick = (url: string) => {
    setPdfPreviewUrl(url)
  }

  const parentPost = post.parent_id ? getParentPost(post.parent_id) : null
  const parentName = parentPost ? profileMap[parentPost.user_id]?.display_name || 'User' : null

  const handleReplyAdded = () => {
    setShowReplyForm(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    if (childReplies.length === 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, a, input, textarea, [data-no-collapse]')) return
    setCollapsed(!collapsed)
  }

  const postRow = (
    <div className={`${styles.feedPost} ${isReply ? styles.feedPostReply : ''}`} onClick={handleCardClick}>
      <div className={styles.avatarColumn}>
        {isReply && <div className={styles.threadLineTop} />}
        <div className={styles.feedPostAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={styles.feedPostAvatarImg} />
          ) : (
            <div className={styles.feedPostAvatarPlaceholder}>
              <User size={isReply ? 14 : 18} />
            </div>
          )}
        </div>
        {childReplies.length > 0 && !collapsed && <div className={styles.threadLineBottom} />}
      </div>

      <div className={styles.feedPostBody}>
        <div className={styles.feedPostHeader}>
          <span className={styles.feedPostAuthor}>{authorName}</span>
          {parentName && (
            <span className={styles.feedPostParentRef}>
              <MessageCircle size={10} />
              replying to {parentName}
            </span>
          )}
          {childReplies.length > 0 && (
            <button className={styles.feedPostCollapseBtn} onClick={() => setCollapsed(!collapsed)} data-tooltip={collapsed ? 'Expand' : 'Collapse'}>
              {collapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              <span>{childReplies.length}</span>
            </button>
          )}
          <span className={styles.feedPostTime}>
            <Clock size={12} />
            {timeAgo}
          </span>
        </div>

        <div className={styles.feedPostMessage}>{post.message}</div>

        {imagePhotos.length > 0 && (
          <div className={styles.feedPostPhotos} data-count={Math.min(imagePhotos.length, 4)}>
            {imagePhotos.slice(0, 4).map((url, i) => (
              <button key={i} className={styles.feedPostPhotoLink} onClick={() => setLightboxIdx(i)}>
                <img src={url} alt="" className={styles.feedPostPhoto} />
              </button>
            ))}
            {imagePhotos.length > 4 && (
              <div className={styles.feedPostPhotoMore}>+{imagePhotos.length - 4}</div>
            )}
          </div>
        )}

        {pdfPhotos.length > 0 && (
          <div className={styles.feedPostPdfGrid}>
            {pdfPhotos.map((url, i) => (
              <button key={i} className={styles.feedPostPdfCard} onClick={() => handlePdfClick(url)}>
                <FileText size={24} />
                <span className={styles.feedPostPdfName}>PDF {i + 1}</span>
                <ExternalLink size={12} />
              </button>
            ))}
          </div>
        )}

        <div className={styles.feedPostFooter}>
          <button
            className={`${styles.feedPostLikeBtn} ${likedByUser ? styles.feedPostLikeBtnActive : ''}`}
            onClick={() => onToggleLike?.(post.id)}
            data-tooltip={likedByUser ? 'Unlike' : 'Like'}
          >
            <Heart size={12} fill={likedByUser ? 'currentColor' : 'none'} />
            <span>{post.likes_count || 0}</span>
          </button>
          {post.location_tag && (
            <span className={styles.feedPostLocation}>
              <MapPin size={12} />
              {post.location_tag}
            </span>
          )}
          <button className={styles.feedPostReplyBtn} onClick={() => setShowReplyForm(!showReplyForm)}>
            <MessageCircle size={12} />
            {showReplyForm ? 'Cancel' : 'Reply'}
          </button>
          <button className={styles.feedPostFlagBtn} onClick={() => setShowIssueForm(true)}>
            <Flag size={12} />
            Flag Issue
          </button>
        </div>

        {showReplyForm && (
          <div className={styles.feedReplyForm}>
            <PostForm
              eventId={eventId}
              parentId={post.id}
              parentAuthorName={authorName}
              teamMembers={teamMembers}
              onSuccess={handleReplyAdded}
              compact
            />
          </div>
        )}
      </div>
    </div>
  )

  const repliesSection = !collapsed && childReplies.length > 0 && depth < MAX_DEPTH && (
    <div className={styles.feedReplies}>
      {childReplies.map((reply) => (
        <LiveFeedPost
          key={reply.id}
          post={reply}
          getReplies={getReplies}
          eventId={eventId}
          displayName={profileMap[reply.user_id]?.display_name}
          avatarUrl={profileMap[reply.user_id]?.avatar_url}
          profileMap={profileMap}
          teamMembers={teamMembers}
          getParentPost={getParentPost}
          isReply
          depth={depth + 1}
          likedByUser={likedByUser}
          onToggleLike={onToggleLike}
        />
      ))}
    </div>
  )

  return (
    <>
      {depth === 0 ? (
        <div className={styles.threadContainer}>
          {postRow}
          {repliesSection}
        </div>
      ) : (
        <div className={styles.threadItem}>
          {postRow}
          {repliesSection}
        </div>
      )}


      {lightboxIdx !== null && (
        <div className={styles.lightboxOverlay} onClick={() => setLightboxIdx(null)}>
          <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setLightboxIdx(null)} data-tooltip="Close">
              <X size={20} />
            </button>
            {imagePhotos.length > 1 && (
              <>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                  onClick={() => setLightboxIdx((prev) => prev === null ? 0 : (prev - 1 + imagePhotos.length) % imagePhotos.length)}
                  data-tooltip="Previous"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                  onClick={() => setLightboxIdx((prev) => prev === null ? 0 : (prev + 1) % imagePhotos.length)}
                  data-tooltip="Next"
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

      {pdfPreviewUrl && (
        <div className={styles.lightboxOverlay} onClick={() => setPdfPreviewUrl(null)}>
          <div className={styles.pdfPreviewContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.lightboxClose} onClick={() => setPdfPreviewUrl(null)} data-tooltip="Close">
              <X size={20} />
            </button>
            <iframe
              src={pdfPreviewUrl}
              className={styles.pdfPreviewIframe}
              title="PDF Preview"
            />
            <a
              href={pdfPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.pdfPreviewOpenBtn}
            >
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        </div>
      )}

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
