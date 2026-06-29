import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Circle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PageHero } from '@/components/shared/PageHero'
import styles from './CalendarPage.module.css'
import type { CalendarEvent } from '@/types'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const TYPE_COLORS: Record<string, string> = {
  event: '#D4A017',
  task_due: '#8B5CF6',
  phase_due: '#F59E0B',
  vendor_payment: '#EF4444',
}

export function CalendarPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  useEffect(() => { loadEvents() }, [user, profile])

  async function loadEvents() {
    const all: CalendarEvent[] = []
    let evtQuery = supabase.from('events').select('id, name, event_date, status, slug').is('deleted_at', null)
    if (profile?.org_id) {
      evtQuery = evtQuery.or(`org_id.eq.${profile.org_id},created_by.eq.${user!.id}`)
    } else {
      evtQuery = evtQuery.eq('created_by', user!.id)
    }

    const { data: evts } = await evtQuery
    if (evts) {
      evts.forEach((e: any) => {
        if (e.event_date) all.push({ id: e.id, title: e.name, date: e.event_date, type: 'event', event_id: e.id, status: e.status })
      })
    }

    const { data: tasks } = await supabase.from('tasks').select('id, title, due_datetime, event_id, status').neq('status', 'done').not('due_datetime', 'is', null).limit(200)
    if (tasks) {
      tasks.forEach((t: any) => {
        all.push({ id: t.id, title: t.title, date: t.due_datetime.slice(0, 10), type: 'task_due', event_id: t.event_id })
      })
    }

    setEvents(all)
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  function getDayEvents(day: number): CalendarEvent[] {
    const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === d)
  }

  function goToday() {
    setViewDate(new Date())
    const d = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    setSelectedDate(d)
  }

  const selectedStr = selectedDate
  const dayEvents = selectedStr
    ? events.filter(e => e.date === selectedStr).sort((a, b) => a.title.localeCompare(b.title))
    : []

  const grid: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) grid.push(null)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)

  return (
    <div>
      <PageHero icon={CalendarIcon} title="Calendar" subtitle="View events and tasks at a glance" />

      <div className={styles.layout}>
        <div className={styles.calCard}>
          <div className={styles.calHeader}>
            <button className={styles.navBtn} onClick={prevMonth}><ChevronLeft size={20} /></button>
            <div className={styles.calTitle}>{MONTHS[month]} {year}</div>
            <button className={styles.navBtn} onClick={nextMonth}><ChevronRight size={20} /></button>
            <button className={styles.todayBtn} onClick={goToday}>Today</button>
          </div>

          <div className={styles.weekRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className={styles.weekLabel}>{d}</div>
            ))}
          </div>

          <div className={styles.grid}>
            {grid.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} className={styles.emptyCell} />
              const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isToday = dStr === todayStr
              const isSelected = dStr === selectedStr
              const dayEvts = getDayEvents(day)
              return (
                <div key={dStr}
                  className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedDate(dStr)}>
                  <span className={styles.dayNum}>{day}</span>
                  <div className={styles.dotWrap}>
                    {dayEvts.slice(0, 3).map((e, j) => (
                      <span key={j} className={styles.eventDot} style={{ background: TYPE_COLORS[e.type] || '#D4A017' }} />
                    ))}
                    {dayEvts.length > 3 && <span className={styles.moreBadge}>+{dayEvts.length - 3}</span>}
                  </div>
                  {dayEvts.length > 0 && dayEvts.length <= 2 && (
                    <div className={styles.dayEventLabel}>{dayEvts[0].title.slice(0, 12)}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={styles.sideCard}>
          <div className={styles.sideTitle}>
            {selectedStr
              ? new Date(selectedStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
              : 'Select a date'}
          </div>

          {selectedStr && dayEvents.length === 0 && (
            <div className={styles.emptyDay}>No events this day</div>
          )}

          <div className={styles.eventList}>
            {dayEvents.map((e, i) => (
              <div key={`${e.id}-${i}`} className={styles.eventRow}
                onClick={() => { if (e.event_id) navigate(`/events/${e.event_id}`) }}>
                <span className={styles.eventDot} style={{ background: TYPE_COLORS[e.type] || '#D4A017' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.eventTitle}>{e.title}</div>
                  <div className={styles.eventMeta}>{e.type.replace('_', ' ')}{e.status ? ` · ${e.status}` : ''}</div>
                </div>
                <ChevronRight size={14} className={styles.eventArrow} />
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            {Object.entries({ event: 'Events', task_due: 'Tasks Due' }).map(([key, label]) => (
              <div key={key} className={styles.legendRow}>
                <Circle size={8} fill={TYPE_COLORS[key]} color={TYPE_COLORS[key]} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
