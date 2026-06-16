import { useState, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { Plus, Trash2, LayoutGrid, Grid3X3 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
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

export function FloorPlanCanvas({ eventId, tables, onTablesChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const snap = useCallback((val: number) => snapToGrid ? Math.round(val / SNAP) * SNAP : val, [snapToGrid])

  const handleDragEnd = async (e: Konva.KonvaEventObject<DragEvent>, tableId: string) => {
    const x = snap(e.target.x())
    const y = snap(e.target.y())
    e.target.position({ x, y })
    onTablesChange(tables.map((t) => t.id === tableId ? { ...t, x, y } : t))
    await supabase.from('seating_tables').update({ x, y }).eq('id', tableId)
  }

  const handleTransformEnd = async (e: Konva.KonvaEventObject<Event>, tableId: string) => {
    const node = e.target
    const width = Math.max(40, node.width() * node.scaleX())
    const height = Math.max(30, node.height() * node.scaleY())
    const rotation = node.rotation()
    node.scaleX(1)
    node.scaleY(1)
    onTablesChange(tables.map((t) => t.id === tableId ? { ...t, width, height, rotation } : t))
    await supabase.from('seating_tables').update({ width, height, rotation }).eq('id', tableId)
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

  const stageWidth = Math.min(CANVAS_WIDTH, containerRef.current?.clientWidth || CANVAS_WIDTH)

  return (
    <div className={styles.floorPlanWrap}>
      <div className={styles.toolbar}>
        <button className={styles.toolbarBtn} onClick={addTable}><Plus size={14} /> Add Table</button>
        <button className={styles.toolbarBtn} onClick={deleteTable} disabled={!selectedId}><Trash2 size={14} /> Delete</button>
        <button className={`${styles.toolbarBtn} ${snapToGrid ? styles.toolbarBtnActive : ''}`} onClick={() => setSnapToGrid(!snapToGrid)}>
          <Grid3X3 size={14} /> Snap {snapToGrid ? 'ON' : 'OFF'}
        </button>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
          Click a table to select, drag to move
        </span>
      </div>

      <div className={styles.canvasContainer} ref={containerRef}>
        <Stage width={stageWidth} height={CANVAS_HEIGHT} ref={stageRef} onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null) }}>
          <Layer>
            {snapToGrid && (
              <Group>
                {Array.from({ length: Math.ceil(CANVAS_WIDTH / SNAP) }).map((_, i) =>
                  Array.from({ length: Math.ceil(CANVAS_HEIGHT / SNAP) }).map((_, j) => (
                    <Rect key={`${i}-${j}`} x={i * SNAP} y={j * SNAP} width={1} height={1} fill="rgba(255,255,255,0.04)" />
                  ))
                )}
              </Group>
            )}
            {tables.map((t) => (
              <Group
                key={t.id}
                x={t.x}
                y={t.y}
                width={t.width}
                height={t.height}
                rotation={t.rotation}
                draggable
                onClick={() => setSelectedId(t.id)}
                onTap={() => setSelectedId(t.id)}
                onDragEnd={(e) => handleDragEnd(e, t.id)}
                onTransformEnd={(e) => handleTransformEnd(e, t.id)}
              >
                <Rect
                  width={t.width}
                  height={t.height}
                  fill={selectedId === t.id ? 'rgba(212, 160, 23, 0.15)' : t.is_vip ? 'rgba(212, 160, 23, 0.08)' : 'rgba(255,255,255,0.06)'}
                  stroke={selectedId === t.id ? '#D4A017' : t.is_vip ? '#D4A017' : 'var(--color-border)'}
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
                <Transformer
                  ref={selectedId === t.id ? transformerRef : undefined}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < 40 || newBox.height < 30) return oldBox
                    return newBox
                  }}
                />
              </Group>
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  )
}
