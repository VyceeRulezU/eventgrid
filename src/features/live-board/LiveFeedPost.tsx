import { useState } from 'react'
import { MapPin, Clock, Flag, User, FileText, ExternalLink, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { IssueForm } from './IssueForm'
import type { LiveFeedPost as LiveFeedPostType } from '@/types'
import styles from './LiveBoardPage.module.css'

interface LiveFeedPostProps {
  post: LiveFeedPostType
  eventId: string
  displayName?: string | null
  avatarUrl?: string | null
}

function isPdfUrl(url: string): boolean {
  return url.toLowerCase().endsWith('.pdf') || url.includes('pdf')
}

export function LiveFeedPost({ post, eventId, displayName, avatarUrl }: LiveFeedPostProps) {
  const [showIssueForm, setShowIssueForm] = useState(false)
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)

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

  const authorName = displayName || 'User'

  const imagePhotos = photos.filter((u) => !isPdfUrl(u))
  const pdfPhotos = photos.filter((u) => isPdfUrl(u))

  const handlePdfClick = (url: string) => {
    setPdfPreviewUrl(url)
  }

  return (
    <>
      <div className={styles.feedPost}>
        <div className={styles.feedPostAvatar}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className={styles.feedPostAvatarImg} />
          ) : (
            <div className={styles.feedPostAvatarPlaceholder}>
              <User size={18} />
            </div>
          )}
        </div>

        <div className={styles.feedPostBody}>
          <div className={styles.feedPostHeader}>
            <span className={styles.feedPostAuthor}>{authorName}</span>
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
