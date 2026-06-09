import { useEffect, useState, useMemo } from 'react'
import { X, Share2, ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { useUIStore } from '@/store/ui.store'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { useSearch } from '@/hooks/useSearch'
import { SearchBar } from '@/components/shared/SearchBar'
import type { Media } from '@/types'
import styles from './Aftermath.module.css'

export function MediaLibrary({ eventId }: { eventId: string }) {
  const user = useAuthStore((s) => s.user)
  const showToast = useUIStore((s) => s.showToast)
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [tagFilter, setTagFilter] = useState<string>('')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { query, setQuery, filtered: searched } = useSearch(media, ['caption'])

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (data) {
        setMedia(data as unknown as Media[])
      }
      setLoading(false)
    }

    load()
  }, [eventId, user])

  const tags = [...new Set(media.map((m) => m.tag).filter(Boolean))] as string[]

  const filtered = useMemo(() => {
    if (tagFilter) return searched.filter((m) => m.tag === tagFilter)
    return searched
  }, [searched, tagFilter])

  const toggleClientShare = async (item: Media) => {
    const newTag = item.tag === 'client_share' ? null : 'client_share'
    const { error } = await supabase
      .from('media')
      .update({ tag: newTag })
      .eq('id', item.id)

    if (error) {
      showToast({ type: 'error', title: 'Error', body: 'Failed to update' })
    } else {
      setMedia((prev) => prev.map((m) => (m.id === item.id ? { ...m, tag: newTag } : m)))
      showToast({ type: 'success', title: newTag ? 'Shared to client portal' : 'Removed from client portal' })
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 'var(--space-4)' }}>
        <img src="/EventGrid-favicon.svg" alt="Loading" style={{ width: 48, height: 48, opacity: 0.5 }} />
        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Loading media...</div>
      </div>
    )
  }

  if (media.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-4)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border-subtle)', borderRadius: 'var(--radius-xl)' }}>
        <Image size={24} style={{ marginBottom: 'var(--space-2)', opacity: 0.4 }} />
        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>No media yet</div>
        <div style={{ fontSize: 'var(--text-xs)', marginTop: 4 }}>Photos and files uploaded during the event will appear here.</div>
      </div>
    )
  }

  return (
    <div>
      <div className={styles.mediaToolbar}>
        <SearchBar value={query} onChange={setQuery} placeholder="Search captions..." containerStyle={{ flex: 1 }} />
        <DropdownMenu
          trigger={<span>{tagFilter || 'All tags'}</span>}
          items={[
            { label: 'All tags', value: '' },
            ...tags.map((t) => ({ label: t, value: t })),
          ]}
          onSelect={(item) => setTagFilter(item.value)}
        />
      </div>

      <div className={styles.mediaGrid}>
        {filtered.map((item) => (
          <div
            key={item.id}
            className={styles.mediaItem}
            onClick={() => setLightboxIndex(media.findIndex((m) => m.id === item.id))}
          >
            <img src={item.url} alt={item.caption || 'Photo'} />
            {item.tag === 'client_share' && (
              <div className={styles.mediaClientBadge}>Client</div>
            )}
          </div>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className={styles.mediaList}>
          {filtered.map((item) => (
            <div key={item.id} className={styles.mediaListItem}>
              <img src={item.url} alt={item.caption || 'Photo'} className={styles.mediaThumb} />
              <div className={styles.mediaInfo}>
                <div className={styles.mediaCaption}>{item.caption || 'Untitled'}</div>
                <div className={styles.mediaMeta}>
                  {item.tag || 'no tag'} &middot; {new Date(item.created_at).toLocaleDateString('en-GB')}
                </div>
              </div>
              <button
                className={`btn btn-sm ${item.tag === 'client_share' ? 'btn-accent' : 'btn-ghost'}`}
                style={{ borderRadius: 'var(--radius-sm)' }}
                onClick={(e) => { e.stopPropagation(); toggleClientShare(item) }}
                title={item.tag === 'client_share' ? 'Remove from client portal' : 'Share to client portal'}
              >
                <Share2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <div className={styles.lightbox} onClick={() => setLightboxIndex(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightboxIndex(null)} data-tooltip="Close">
            <X size={24} />
          </button>

          {lightboxIndex > 0 && (
            <button
              className={styles.lightboxNav}
              style={{ left: 16 }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1) }}
              data-tooltip="Previous"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {lightboxIndex < filtered.length - 1 && (
            <button
              className={styles.lightboxNav}
              style={{ right: 16 }}
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1) }}
              data-tooltip="Next"
            >
              <ChevronRight size={24} />
            </button>
          )}

          <img
            src={filtered[lightboxIndex].url}
            alt={filtered[lightboxIndex].caption || 'Photo'}
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
