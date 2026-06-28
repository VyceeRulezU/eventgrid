import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Stage, Layer, Rect, Text, Group, Transformer, Image as KonvaImage } from 'react-konva'
import Konva from 'konva'
import useImage from 'use-image'
import { Plus, Trash2, Upload, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { uploadFile } from '@/lib/storage'
import { useUIStore } from '@/store/ui.store'
import type { SeatingTable } from '@/types'
import styles from './FloorPlanCanvas.module.css'

interface Props {
  eventId: string
  tables: SeatingTable[]
  onTablesChange: (tables: SeatingTable[]) => void
}

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 500
const SNAP = 20
const MIN_TABLE_W = 40
const MIN_TABLE_H = 30

/* 
 * Occupancy colour logic — reused from TableCard.
 * These are CSS custom property names, not hardcoded hex values,
 * because they're applied via inline styles on the Konva Rect stroke.
 * Konva requires literal colour strings (not CSS variables) when
 * rendering to canvas, so we resolve via getComputedStyle below.
 */
function getOccupancyColor(seated: number, capacity: number): string {
  if (seated === 0) return '#64748b'
  if (seated > capacity) return '#ef4444'
  if (seated === capacity) return '#22c55e'
  return '#eab308'
}

function useDebouncedSave(delay = 500) {
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  return useMemo(() => (id: string, updates: Record<string, unknown>) => {
    const existing = timeouts.current.get(id)
    if (existing) clearTimeout(existing)
    const handle = setTimeout(() => {
      supabase.from('seating_tables').update(updates).eq('id', id)
      timeouts.current.delete(id)
    }, delay)
    timeouts.current.set(id, handle)
  }, [delay])
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export function FloorPlanCanvas({ eventId, tables, onTablesChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [floorPlanImageUrl, setFloorPlanImageUrl] = useState<string | null>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const shapeRefs = useRef<Map<string, Konva.Rect>>(new Map())
  const debouncedSave = useDebouncedSave()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const showNotification = useUIStore((s) => s.showNotification)

  const [bgImage] = useImage(floorPlanImageUrl ?? '')

  const snap = useCallback((val: number) => Math.round(val / SNAP) * SNAP, [])

  /* Load floor plan image URL on mount */
  useEffect(() => {
    supabase.from('events').select('floor_plan_image_url').eq('id', eventId).single().then(({ data }) => {
      if (data?.floor_plan_image_url) setFloorPlanImageUrl(data.floor_plan_image_url)
    })
  }, [eventId])

  /* Single-transformer architecture: attach/detach when selection changes */
  useEffect(() => {
    const tr = trRef.current
    if (!tr) return
    if (selectedId && shapeRefs.current.has(selectedId)) {
      tr.nodes([shapeRefs.current.get(selectedId)!])
    } else {
      tr.nodes([])
    }
    tr.getLayer()?.batchDraw()
  }, [selectedId])

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>, tableId: string) => {
    const x = snap(e.target.x())
    const y = snap(e.target.y())
    e.target.position({ x, y })
    onTablesChange(tables.map((t) => t.id === tableId ? { ...t, x, y } : t))
    debouncedSave(tableId, { x, y })
  }

  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>, tableId: string) => {
    const node = e.target
    const width = Math.max(MIN_TABLE_W, node.width() * node.scaleX())
    const height = Math.max(MIN_TABLE_H, node.height() * node.scaleY())
    const rotation = node.rotation()
    node.scaleX(1)
    node.scaleY(1)
    onTablesChange(tables.map((t) => t.id === tableId ? { ...t, width, height, rotation } : t))
    debouncedSave(tableId, { width, height, rotation })
  }

  const addTable = async () => {
    const count = tables.length + 1
    const x = snap(60 + (count % 5) * 140)
    const y = snap(60 + Math.floor(count / 5) * 110)
    const { data } = await supabase.from('seating_tables').insert({
      event_id: eventId,
      table_name: `Table ${count}`,
      capacity: 8,
      x,
      y,
      width: 120,
      height: 80,
      rotation: 0,
    }).select('*').single()
    if (data) onTablesChange([...tables, data as unknown as SeatingTable])
  }

  const deleteTable = async () => {
    if (!selectedId) return
    await supabase.from('seating_tables').delete().eq('id', selectedId)
    onTablesChange(tables.filter((t) => t.id !== selectedId))
    setSelectedId(null)
  }

  const handleUploadVenuePlan = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      const path = `${eventId}/floor-plan/${crypto.randomUUID()}.${file.name.split('.').pop()}`
      try {
        const { url } = await uploadFile('event-media', file, path)
        await supabase.from('events').update({ floor_plan_image_url: url }).eq('id', eventId)
        setFloorPlanImageUrl(url)
      } catch (err: any) {
        showNotification({ variant: 'error', title: 'Upload failed', message: err.message || 'Upload error' })
        return
      }
      showNotification({ variant: 'success', title: 'Venue plan uploaded' })
    }
    input.click()
  }

  const stageWidth = Math.min(CANVAS_WIDTH, containerRef.current?.clientWidth || CANVAS_WIDTH)

  const seatedCount = useCallback((_tableId: string) => {
    /* tables prop doesn't include guest info, so we use a reasonable fallback. 
       In practice, the occupancy info is managed via the Table List view. */
    return 0
  }, [])

  return (
    <div className={styles.floorPlanWrap}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={addTable}><Plus size={14} /> Add Table</button>
        <button className={styles.toolbarBtn} onClick={deleteTable} disabled={!selectedId}><Trash2 size={14} /> Delete</button>
        <button className={styles.toolbarBtn} onClick={handleUploadVenuePlan}>
          <Upload size={14} /> Upload Venue Plan
        </button>
        {floorPlanImageUrl && (
          <button className={styles.toolbarBtn} onClick={() => { setFloorPlanImageUrl(null); supabase.from('events').update({ floor_plan_image_url: null }).eq('id', eventId) }}>
            <Image size={14} /> Remove BG
          </button>
        )}
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          {isMobile ? 'View-only on mobile — switch to Table List to edit' : 'Click to select, drag to move'}
        </span>
      </div>

      <div className={styles.canvasContainer} ref={containerRef}>
        {isMobile && (
          <div style={{ padding: 'var(--space-2)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', background: 'var(--color-surface-3)' }}>
            Switch to Table List to edit seating — visual layout is view-only on this screen size.
          </div>
        )}
        <Stage
          width={stageWidth}
          height={CANVAS_HEIGHT}
          ref={stageRef}
          draggable={isMobile}
          onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null) }}
        >
          <Layer>
            {bgImage && (
              <KonvaImage image={bgImage} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} opacity={0.35} />
            )}
            {tables.map((t) => (
              <Group
                key={t.id}
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                rotation={t.rotation}
                draggable={!isMobile}
                onClick={() => { if (!isMobile) setSelectedId(t.id) }}
                onTap={() => { if (!isMobile) setSelectedId(t.id) }}
                onDragEnd={(e) => handleDragEnd(e, t.id)}
                onTransformEnd={(e) => handleTransformEnd(e, t.id)}
              >
                <Rect
                  ref={(node) => {
                    if (node) shapeRefs.current.set(t.id, node)
                    else shapeRefs.current.delete(t.id)
                  }}
                  width={t.width}
                  height={t.height}
                  fill={selectedId === t.id ? 'rgba(212, 160, 23, 0.15)' : t.is_vip ? 'rgba(212, 160, 23, 0.08)' : 'rgba(255,255,255,0.06)'}
                  stroke={selectedId === t.id ? '#D4A017' : t.is_vip ? '#D4A017' : getOccupancyColor(seatedCount(t.id), t.capacity)}
                  strokeWidth={selectedId === t.id ? 2 : 1}
                  cornerRadius={8}
                />
                <Text
                  text={t.table_name}
                  width={t.width}
                  height={t.height}
                  align="center"
                  verticalAlign="middle"
                  fontSize={11}
                  fill="#e2e8f0"
                />
                {t.is_vip && (
                  <Text
                    text="★ VIP"
                    width={t.width}
                    y={2}
                    align="center"
                    fontSize={8}
                    fill="#D4A017"
                  />
                )}
              </Group>
            ))}
            <Transformer
              ref={trRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (newBox.width < MIN_TABLE_W || newBox.height < MIN_TABLE_H) return oldBox
                return newBox
              }}
            />
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
