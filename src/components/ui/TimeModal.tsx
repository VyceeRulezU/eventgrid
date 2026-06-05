import { useState, useEffect } from 'react'
import styles from './TimeModal.module.css'

interface TimeModalProps {
  open: boolean
  value: string // 'HH:MM' (24-hour format)
  onChange: (time: string) => void
  onClose: () => void
}

const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

export function TimeModal({ open, value, onChange, onClose }: TimeModalProps) {
  const [selectedHour, setSelectedHour] = useState(9)
  const [selectedMinute, setSelectedMinute] = useState(0)
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM')

  useEffect(() => {
    if (value && value.includes(':')) {
      const [h24Str, mStr] = value.split(':')
      const h24 = parseInt(h24Str, 10)
      const m = parseInt(mStr, 10)

      // Parse 24h to 12h
      const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM'
      let h12 = h24 % 12
      if (h12 === 0) h12 = 12

      // Round minute to nearest 5 for grid compatibility
      const roundedM = Math.round(m / 5) * 5
      const finalM = roundedM >= 60 ? 55 : roundedM

      setSelectedHour(h12)
      setSelectedMinute(finalM)
      setSelectedPeriod(period)
    }
  }, [value, open])

  if (!open) return null

  const handleConfirm = () => {
    let h24 = selectedHour
    if (selectedPeriod === 'PM') {
      if (h24 !== 12) h24 += 12
    } else {
      if (h24 === 12) h24 = 0
    }

    const timeStr = `${String(h24).padStart(2, '0')}:${String(selectedMinute).padStart(2, '0')}`
    onChange(timeStr)
    onClose()
  }

  const formatMin = (m: number) => String(m).padStart(2, '0')

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Select Time</div>
        </div>

        <div className={styles.body}>
          {/* Hours Column */}
          <div className={styles.column}>
            <div className={styles.colLabel}>Hour</div>
            <div className={styles.grid}>
              {HOURS.map((h) => (
                <button
                  key={h}
                  type="button"
                  className={`${styles.cell} ${selectedHour === h ? styles.isSelected : ''}`}
                  onClick={() => setSelectedHour(h)}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* Minutes Column */}
          <div className={styles.column}>
            <div className={styles.colLabel}>Minute</div>
            <div className={styles.grid}>
              {MINUTES.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`${styles.cell} ${selectedMinute === m ? styles.isSelected : ''}`}
                  onClick={() => setSelectedMinute(m)}
                >
                  {formatMin(m)}
                </button>
              ))}
            </div>
          </div>

          {/* AM/PM Column */}
          <div className={`${styles.column} ${styles.periodColumn}`}>
            <div className={styles.colLabel}>Period</div>
            <div className={styles.periodGroup}>
              {(['AM', 'PM'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`${styles.periodBtn} ${selectedPeriod === p ? styles.isSelected : ''}`}
                  onClick={() => setSelectedPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose} type="button">Cancel</button>
          <button className={styles.confirmBtn} onClick={handleConfirm} type="button">
            Confirm {selectedHour}:{formatMin(selectedMinute)} {selectedPeriod}
          </button>
        </div>
      </div>
    </div>
  )
}
