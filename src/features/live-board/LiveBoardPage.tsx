import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useLiveBoardStore } from '@/store/liveBoard.store'
import { useUIStore } from '@/store/ui.store'
import { StatusCard } from './StatusCard'
import { IssuesPanel } from './IssuesPanel'
import { ArrowLeft, Plus, LayoutDashboard, Clock, X } from 'lucide-react'
import type { LiveBoardItem, Issue } from '@/types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import styles from './LiveBoardPage.module.css'

export function LiveBoardPage() {
  const { id: eventId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { items, setItems, updateItem, setIssues, addIssue } = useLiveBoardStore()
  const showNotification = useUIStore((s) => s.showNotification)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStation, setNewStation] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [saving, setSaving] = useState(false)

  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!eventId) return

    async function loadData() {
      setLoading(true)
      setError(null)

      const [itemsRes, issuesRes] = await Promise.all([
        supabase.from('live_board_items').select('*').eq('event_id', eventId).order('sort_order'),
        supabase.from('issues').select('*').eq('event_id', eventId),
      ])

      if (itemsRes.error) {
        setError(itemsRes.error.message)
        setLoading(false)
        return
      }
      if (issuesRes.error) {
        setError(issuesRes.error.message)
        setLoading(false)
        return
      }

      setItems(itemsRes.data as unknown as LiveBoardItem[])
      setIssues(issuesRes.data as unknown as Issue[])
      setLoading(false)
    }

    loadData()

    const boardChannel = supabase.channel('live_board:' + eventId)
    boardChannel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_board_items',
        filter: 'event_id=eq.' + eventId,
      }, (payload: any) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
          const row = payload.new as LiveBoardItem
          updateItem(row.id, row.status as LiveBoardItem['status'], row.status_label || undefined)
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

    channelRef.current = boardChannel

    return () => {
      boardChannel.unsubscribe()
    }
  }, [eventId])

  const handleAddStation = async () => {
    if (!newStation.trim() || !eventId) return
    setSaving(true)

    const sortOrder = items.length
    const { data, error } = await supabase
      .from('live_board_items')
      .insert({
        event_id: eventId,
        station_name: newStation.trim(),
        category: newCategory.trim() || null,
        status: 'grey',
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      showNotification({ variant: 'error', title: 'Failed to add station', message: error.message })
      setSaving(false)
      return
    }

    if (data) {
      setItems([...items, data as unknown as LiveBoardItem])
    }

    setNewStation('')
    setNewCategory('')
    setShowAddForm(false)
    setSaving(false)
    showNotification({ variant: 'success', title: 'Station added' })
  }

  const programTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap}>
          <img src="/EventGrid-favicon.svg" alt="Loading" className={styles.loadingImg} />
          <div className={styles.loadingText}>Loading live board...</div>
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
        <div className="empty-state__title">Failed to load board</div>
        <div className="empty-state__description">{error}</div>
        <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => navigate(`/events/${eventId}`)}>
          <ArrowLeft size={16} />
          Back to Event
        </button>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className="btn btn-ghost btn-icon" onClick={() => navigate(`/events/${eventId}`)} aria-label="Back">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className={styles.headerTitle}>Live Board</h2>
            <div className={styles.headerDesc}>Real-time station status</div>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.clockBadge}>
            <Clock size={16} className={styles.clockIcon} />
            {programTime}
          </div>
          <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} />
            Add Station
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className={styles.addForm}>
          <div className={styles.addFormHeader}>
            <div className={styles.addFormTitle}>New Station</div>
            <button className="btn btn-ghost btn-sm btn-icon" style={{ width: 28, minHeight: 28 }} onClick={() => setShowAddForm(false)}>
              <X size={14} />
            </button>
          </div>
          <div className={styles.addFormRow}>
            <input
              className="input"
              style={{ flex: 2, minWidth: 160, minHeight: 36, fontSize: 'var(--text-sm)' }}
              placeholder="Station name..."
              value={newStation}
              onChange={(e) => setNewStation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddStation()}
            />
            <input
              className="input"
              style={{ flex: 1, minWidth: 120, minHeight: 36, fontSize: 'var(--text-sm)' }}
              placeholder="Category (optional)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" style={{ borderRadius: 'var(--radius-sm)' }} onClick={handleAddStation} disabled={saving || !newStation.trim()}>
              {saving ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__icon">
            <LayoutDashboard size={24} />
          </div>
          <div className="empty-state__title">No stations yet</div>
          <div className="empty-state__description">
            Add stations to start tracking their live status
          </div>
          <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)' }} onClick={() => setShowAddForm(true)}>
            <Plus size={16} />
            Add Station
          </button>
        </div>
      ) : (
        <div className={styles.contentWrap}>
          <div className={styles.stationGrid}>
            {items.map((item) => (
              <StatusCard key={item.id} item={item} />
            ))}
          </div>

          <IssuesPanel />
        </div>
      )}
    </div>
  )
}
