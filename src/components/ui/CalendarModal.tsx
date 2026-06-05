import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import styles from './CalendarModal.module.css'

interface CalendarModalProps {
  open: boolean
  value: string
  onChange: (date: string) => void
  onClose: () => void
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function CalendarModal({ open, value, onChange, onClose }: CalendarModalProps) {
  const parsed = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(parsed.getFullYear())
  const [viewMonth, setViewMonth] = useState(parsed.getMonth())
  const [selectedDate, setSelectedDate] = useState(value || '')

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const startDay = new Date(viewYear, viewMonth, 1).getDay()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const prevMonth = useCallback(() => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11) }
    else { setViewMonth(viewMonth - 1) }
  }, [viewMonth, viewYear])

  const nextMonth = useCallback(() => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0) }
    else { setViewMonth(viewMonth + 1) }
  }, [viewMonth, viewYear])

  const handleSelect = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const handleConfirm = () => {
    onChange(selectedDate)
    onClose()
  }

  if (!open) return null

  const cells: React.ReactNode[] = []
  for (let i = 0; i < startDay; i++) {
    cells.push(<div key={`empty-${i}`} className={styles.dayCell} />)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const isSelected = dateStr === selectedDate
    cells.push(
      <button
        key={d}
        className={`${styles.dayCell} ${styles.dayBtn} ${isToday ? styles.isToday : ''} ${isSelected ? styles.isSelected : ''}`}
        onClick={() => handleSelect(d)}
        type="button"
      >
        {d}
      </button>
    )
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button className={styles.navBtn} onClick={prevMonth} type="button">
            <ChevronLeft size={18} />
          </button>
          <div className={styles.headerLabel}>
            {MONTHS[viewMonth]} {viewYear}
          </div>
          <button className={styles.navBtn} onClick={nextMonth} type="button">
            <ChevronRight size={18} />
          </button>
        </div>

        <div className={styles.weekRow}>
          {DAYS.map((d) => (
            <div key={d} className={styles.weekLabel}>{d}</div>
          ))}
        </div>

        <div className={styles.grid}>
          {cells}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
          <button className={styles.confirmBtn} onClick={handleConfirm} disabled={!selectedDate} type="button">
            {selectedDate ? `Select ${selectedDate}` : 'Select a date'}
          </button>
        </div>
      </div>
    </div>
  )
}
