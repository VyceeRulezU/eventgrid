import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Circle, Search, Filter, Plus, Star, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth.store'
import { PageHero } from '@/components/shared/PageHero'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import styles from './CalendarPage.module.css'
import type { CalendarEvent } from '@/types'

const tabsList = [
  { key: 'all', label: 'All Scheduled', icon: <CalendarIcon size={14} /> },
  { key: 'event', label: 'Events', icon: <Star size={14} /> },
  { key: 'meeting', label: 'Meetings', icon: <Users size={14} /> },
  { key: 'task', label: 'Task Reminders', icon: <Circle size={8} fill="#8B5CF6" color="#8B5CF6" /> }
] as const

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] // 7 AM to 9 PM
const HOUR_HEIGHT = 70 // px

const CATEGORY_STYLES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  event: { label: 'Event', color: 'var(--color-accent)', bg: 'rgba(212, 160, 23, 0.12)', border: 'var(--color-accent)' },
  meeting: { label: 'Meeting', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.12)', border: '#3B82F6' },
  reminder: { label: 'Meetup/Reminder', color: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', border: '#22C55E' },
  task: { label: 'Task Due', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.12)', border: '#8B5CF6' },
}

interface ExtendedCalendarEvent extends CalendarEvent {
  rawDateTime?: string;
  category: 'event' | 'task' | 'meeting' | 'reminder';
  startHour: number;
  duration: number;
  width?: string;
  left?: string;
}

export function CalendarPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const profile = useAuthStore((s) => s.profile)

  // State
  const [viewDate, setViewDate] = useState(new Date())
  const [events, setEvents] = useState<ExtendedCalendarEvent[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState<'all' | 'event' | 'meeting' | 'task'>('all')
  const [activeView, setActiveView] = useState<'month' | 'week' | 'day'>('week')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  const today = new Date()
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // Keep track of current hour for timeline indicator
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    loadEvents()
  }, [user, profile])

  async function loadEvents() {
    const all: ExtendedCalendarEvent[] = []
    
    // 1. Fetch Events
    let evtQuery = supabase.from('events').select('id, name, event_date, status, slug').is('deleted_at', null)
    if (profile?.org_id) {
      evtQuery = evtQuery.or(`org_id.eq.${profile.org_id},created_by.eq.${user!.id}`)
    } else {
      evtQuery = evtQuery.eq('created_by', user!.id)
    }

    const { data: evts } = await evtQuery
    if (evts) {
      evts.forEach((e: any) => {
        if (e.event_date) {
          all.push({
            id: e.id,
            title: e.name,
            date: e.event_date,
            rawDateTime: e.event_date,
            type: 'event',
            event_id: e.id,
            status: e.status,
            category: 'event',
            startHour: 10.0, // Default event hour: 10 AM
            duration: 2.0,   // Default event duration: 2 hours
          })
        }
      })
    }

    // 2. Fetch Tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_datetime, event_id, status')
      .neq('status', 'done')
      .not('due_datetime', 'is', null)
      .limit(200)

    if (tasks) {
      tasks.forEach((t: any) => {
        const titleLower = t.title.toLowerCase()
        let category: 'task' | 'meeting' | 'reminder' = 'task'
        let duration = 1.0

        if (
          titleLower.includes('meeting') ||
          titleLower.includes('call') ||
          titleLower.includes('kickoff') ||
          titleLower.includes('feedback') ||
          titleLower.includes('presentation') ||
          titleLower.includes('discussion')
        ) {
          category = 'meeting'
          duration = 1.0
        } else if (
          titleLower.includes('meetup') ||
          titleLower.includes('webinar') ||
          titleLower.includes('workshop') ||
          titleLower.includes('seminar') ||
          titleLower.includes('training')
        ) {
          category = 'reminder'
          duration = 1.5
        }

        // Parse start hour from due_datetime
        let startHour = 9.0
        const dateStr = t.due_datetime
        if (dateStr && dateStr.includes('T')) {
          try {
            const timePart = dateStr.split('T')[1]
            const [hStr, mStr] = timePart.split(':')
            const h = parseInt(hStr, 10)
            const m = parseInt(mStr, 10)
            if (!isNaN(h)) {
              startHour = h + (isNaN(m) ? 0 : m / 60)
            }
          } catch (err) {
            // Default to 9 AM
          }
        }

        all.push({
          id: t.id,
          title: t.title,
          date: t.due_datetime.slice(0, 10),
          rawDateTime: t.due_datetime,
          type: 'task_due',
          event_id: t.event_id,
          status: t.status,
          category,
          startHour,
          duration,
        })
      })
    }

    setEvents(all)
  }

  // Helpers for navigation
  const getStartOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // adjust for Monday start
    const monday = new Date(d.setDate(diff))
    monday.setHours(0, 0, 0, 0)
    return monday
  }

  function prevPeriod() {
    if (activeView === 'month') {
      setViewDate(new Date(year, month - 1, 1))
    } else if (activeView === 'week') {
      const d = new Date(viewDate)
      d.setDate(d.getDate() - 7)
      setViewDate(d)
    } else {
      const d = new Date(viewDate)
      d.setDate(d.getDate() - 1)
      setViewDate(d)
    }
    setSelectedDate(null)
  }

  function nextPeriod() {
    if (activeView === 'month') {
      setViewDate(new Date(year, month + 1, 1))
    } else if (activeView === 'week') {
      const d = new Date(viewDate)
      d.setDate(d.getDate() + 7)
      setViewDate(d)
    } else {
      const d = new Date(viewDate)
      d.setDate(d.getDate() + 1)
      setViewDate(d)
    }
    setSelectedDate(null)
  }

  function goToday() {
    const d = new Date()
    setViewDate(d)
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setSelectedDate(dStr)
  }

  // Filter events based on active tab and search query
  const filteredEvents = events.filter(e => {
    // Tab filtering
    if (activeTab === 'event' && e.category !== 'event') return false
    if (activeTab === 'meeting' && e.category !== 'meeting') return false
    if (activeTab === 'task' && e.category !== 'task' && e.category !== 'reminder') return false

    // Search query filtering
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      if (!e.title.toLowerCase().includes(q)) return false
    }

    return true
  })

  // Date Range Indicator string
  function getRangeLabel() {
    if (activeView === 'month') {
      return `${MONTHS[month]} ${year}`
    } else if (activeView === 'week') {
      const startOfWeek = getStartOfWeek(viewDate)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6)
      const startStr = startOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
      const endStr = endOfWeek.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      return `${startStr} - ${endStr}`
    } else {
      return viewDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
    }
  }

  // Navigate on event click
  const handleEventClick = (e: ExtendedCalendarEvent) => {
    if (e.type === 'event' && e.event_id) {
      navigate(`/events/${e.event_id}`)
    } else if (e.type === 'task_due') {
      if (e.event_id) {
        navigate(`/events/${e.event_id}/tasks`)
      } else {
        navigate(`/dashboard/my-tasks`)
      }
    }
  }

  // Time formatter
  function formatHour(h: number) {
    if (h === 12) return '12 PM'
    if (h < 12) return `${h} AM`
    return `${h - 12} PM`
  }

  function getEventTimeStr(evt: ExtendedCalendarEvent) {
    const sh = evt.startHour
    const eh = sh + evt.duration
    
    const formatTime = (hour: number) => {
      const hrs = Math.floor(hour)
      const mins = Math.round((hour - hrs) * 60)
      const ampm = hrs >= 12 ? 'PM' : 'AM'
      const displayHrs = hrs % 12 === 0 ? 12 : hrs % 12
      const displayMins = mins === 0 ? '' : `:${String(mins).padStart(2, '0')}`
      return `${displayHrs}${displayMins} ${ampm}`
    }

    return `${formatTime(sh)} - ${formatTime(eh)}`
  }

  // Render Month View Grid
  function renderMonthView() {
    const grid: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) grid.push(null)
    for (let d = 1; d <= daysInMonth; d++) grid.push(d)

    const selectedStr = selectedDate
    const dayEventsList = selectedStr
      ? filteredEvents.filter(e => e.date === selectedStr).sort((a, b) => a.title.localeCompare(b.title))
      : []

    return (
      <div className={styles.monthLayout}>
        <div className={styles.calCard}>
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
              const dayEvts = filteredEvents.filter(e => e.date === dStr)
              
              return (
                <div key={dStr}
                  className={`${styles.dayCell} ${isToday ? styles.today : ''} ${isSelected ? styles.selectedMonthDay : ''}`}
                  onClick={() => setSelectedDate(dStr)}>
                  <span className={styles.dayNum}>{day}</span>
                  <div className={styles.dotWrap}>
                    {dayEvts.slice(0, 3).map((e, j) => (
                      <span key={j} className={styles.eventDot} style={{ background: CATEGORY_STYLES[e.category]?.color || '#D4A017' }} />
                    ))}
                    {dayEvts.length > 3 && <span className={styles.moreBadge}>+{dayEvts.length - 3}</span>}
                  </div>
                  {dayEvts.length > 0 && dayEvts.length <= 2 && (
                    <div className={styles.dayEventLabel}>{dayEvts[0].title.slice(0, 14)}</div>
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

          {selectedStr && dayEventsList.length === 0 && (
            <div className={styles.emptyDay}>No items scheduled this day</div>
          )}

          <div className={styles.eventList}>
            {dayEventsList.map((e, i) => (
              <div key={`${e.id}-${i}`} className={styles.eventRow} onClick={() => handleEventClick(e)}>
                <span className={styles.eventDot} style={{ background: CATEGORY_STYLES[e.category]?.color || '#D4A017' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.eventTitle}>{e.title}</div>
                  <div className={styles.eventMeta}>
                    {CATEGORY_STYLES[e.category]?.label} {e.status ? ` · ${e.status}` : ''}
                  </div>
                </div>
                <ChevronRight size={14} className={styles.eventArrow} />
              </div>
            ))}
          </div>

          <div className={styles.legend}>
            {Object.entries(CATEGORY_STYLES).map(([key, item]) => (
              <div key={key} className={styles.legendRow}>
                <Circle size={8} fill={item.color} color={item.color} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Process timeline layout (calculates width & left offset for overlaps)
  function processTimelineEvents(evts: ExtendedCalendarEvent[]): ExtendedCalendarEvent[] {
    const sorted = [...evts].sort((a, b) => a.startHour - b.startHour)
    
    return sorted.map((evt, idx) => {
      // Find other events that overlap in time
      const overlaps = sorted.filter((other, oIdx) => {
        if (oIdx === idx) return false
        const evtStart = evt.startHour
        const evtEnd = evt.startHour + evt.duration
        const otherStart = other.startHour
        const otherEnd = other.startHour + other.duration
        return (evtStart < otherEnd && evtEnd > otherStart)
      })

      if (overlaps.length === 0) {
        return { ...evt, width: '100%', left: '0%' }
      }

      // Distribute width side-by-side
      const preOverlapsCount = sorted.slice(0, idx).filter(other => {
        const evtStart = evt.startHour
        const evtEnd = evt.startHour + evt.duration
        const otherStart = other.startHour
        const otherEnd = other.startHour + other.duration
        return (evtStart < otherEnd && evtEnd > otherStart)
      }).length

      const columnsCount = overlaps.length + 1
      const width = 100 / columnsCount
      const left = preOverlapsCount * width

      return {
        ...evt,
        width: `calc(${width}% - 4px)`,
        left: `${left}%`
      }
    })
  }

  // Render Week View Timeline
  function renderWeekView() {
    const startOfWeek = getStartOfWeek(viewDate)
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek)
      d.setDate(startOfWeek.getDate() + i)
      weekDays.push(d)
    }

    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60

    return (
      <div className={styles.timelineContainer}>
        {/* Day Column Headers */}
        <div className={styles.timelineHeader}>
          <div className={styles.hourColHeader} />
          {weekDays.map((day, i) => {
            const dStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
            const isToday = dStr === todayStr
            const isCurrentMonth = day.getMonth() === month
            
            return (
              <div
                key={i}
                className={`${styles.dayColHeader} ${isToday ? styles.todayColHeader : ''} ${!isCurrentMonth ? styles.dimmedDayHeader : ''}`}
              >
                <span className={styles.timelineDayName}>{WEEKDAYS[day.getDay()]}</span>
                <span className={styles.timelineDayNum}>{day.getDate()}</span>
              </div>
            )
          })}
        </div>

        {/* Scrollable Timeline Grid */}
        <div className={styles.timelineBody}>
          <div className={styles.timelineGridContent}>
            {/* Background Grid Row Lines */}
            {HOURS.map((h, i) => (
              <div
                key={h}
                className={styles.gridRowLine}
                style={{ top: `${i * HOUR_HEIGHT}px` }}
              />
            ))}

            {/* Hours Labels Column */}
            <div className={styles.hourLabelColumn}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className={styles.hourLabel}
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Day Columns containing Event Blocks */}
            <div className={styles.timelineColumnsGrid}>
              {weekDays.map((day, dIdx) => {
                const dStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
                const isToday = dStr === todayStr
                
                // Get events for this day
                const dayEvts = filteredEvents.filter(e => e.date === dStr)
                const processed = processTimelineEvents(dayEvts)

                return (
                  <div
                    key={dIdx}
                    className={`${styles.timelineDayColumn} ${isToday ? styles.activeDayColumn : ''}`}
                    style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}
                  >
                    {/* Events absolute container */}
                    <div className={styles.eventsContainer}>
                      {processed.map(e => {
                        const styleItem = CATEGORY_STYLES[e.category]
                        // Clamp within timeline hours (7 AM to 9 PM)
                        const start = Math.max(HOURS[0], Math.min(HOURS[HOURS.length - 1] + 1, e.startHour))
                        const duration = Math.min(HOURS[HOURS.length - 1] + 1 - start, e.duration)
                        const topPos = (start - HOURS[0]) * HOUR_HEIGHT
                        const blockHeight = duration * HOUR_HEIGHT

                        return (
                          <div
                            key={e.id}
                            className={styles.eventBlock}
                            style={{
                              top: `${topPos + 3}px`,
                              height: `${blockHeight - 6}px`,
                              width: e.width || '100%',
                              left: e.left || '0%',
                              backgroundColor: styleItem?.bg || 'var(--color-surface-2)',
                              borderLeft: `3px solid ${styleItem?.color || 'var(--color-accent)'}`
                            }}
                            onClick={() => handleEventClick(e)}
                          >
                            <div className={styles.eventBlockContent}>
                              <div className={styles.eventBlockTime} style={{ color: styleItem?.color }}>
                                {getEventTimeStr(e)}
                              </div>
                              <div className={styles.eventBlockTitle}>{e.title}</div>
                              {e.status && (
                                <div className={styles.eventBlockStatus}>{e.status}</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Today current time line indicator */}
                    {isToday && currentHour >= HOURS[0] && currentHour <= HOURS[HOURS.length - 1] + 1 && (
                      <div
                        className={styles.currentTimeLine}
                        style={{ top: `${(currentHour - HOURS[0]) * HOUR_HEIGHT}px` }}
                      >
                        <span className={styles.currentTimeDot} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Day View Timeline
  function renderDayView() {
    const currentHour = currentTime.getHours() + currentTime.getMinutes() / 60
    const dStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(viewDate.getDate()).padStart(2, '0')}`
    const isToday = dStr === todayStr

    const dayEvts = filteredEvents.filter(e => e.date === dStr)
    const processed = processTimelineEvents(dayEvts)

    return (
      <div className={styles.timelineContainer}>
        {/* Header showing Selected Day */}
        <div className={styles.timelineHeader}>
          <div className={styles.hourColHeader} />
          <div className={`${styles.dayColHeader} ${isToday ? styles.todayColHeader : ''}`}>
            <span className={styles.timelineDayName}>{WEEKDAYS[viewDate.getDay()]}</span>
            <span className={styles.timelineDayNum}>{viewDate.getDate()}</span>
          </div>
        </div>

        {/* Scrollable grid body */}
        <div className={styles.timelineBody}>
          <div className={styles.timelineGridContent} style={{ gridTemplateColumns: '60px 1fr' }}>
            {/* Background Grid Row Lines */}
            {HOURS.map((h, i) => (
              <div
                key={h}
                className={styles.gridRowLine}
                style={{ top: `${i * HOUR_HEIGHT}px`, left: '60px', width: 'calc(100% - 60px)' }}
              />
            ))}

            {/* Hours Labels */}
            <div className={styles.hourLabelColumn}>
              {HOURS.map((h, i) => (
                <div
                  key={h}
                  className={styles.hourLabel}
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                  {formatHour(h)}
                </div>
              ))}
            </div>

            {/* Single Day Column */}
            <div
              className={`${styles.timelineDayColumn} ${isToday ? styles.activeDayColumn : ''}`}
              style={{ height: `${HOURS.length * HOUR_HEIGHT}px`, left: '0px', position: 'relative' }}
            >
              <div className={styles.eventsContainer}>
                {processed.map(e => {
                  const styleItem = CATEGORY_STYLES[e.category]
                  const start = Math.max(HOURS[0], Math.min(HOURS[HOURS.length - 1] + 1, e.startHour))
                  const duration = Math.min(HOURS[HOURS.length - 1] + 1 - start, e.duration)
                  const topPos = (start - HOURS[0]) * HOUR_HEIGHT
                  const blockHeight = duration * HOUR_HEIGHT

                  return (
                    <div
                      key={e.id}
                      className={styles.eventBlock}
                      style={{
                        top: `${topPos + 3}px`,
                        height: `${blockHeight - 6}px`,
                        width: e.width || '100%',
                        left: e.left || '0%',
                        backgroundColor: styleItem?.bg || 'var(--color-surface-2)',
                        borderLeft: `3px solid ${styleItem?.color || 'var(--color-accent)'}`
                      }}
                      onClick={() => handleEventClick(e)}
                    >
                      <div className={styles.eventBlockContent}>
                        <div className={styles.eventBlockTime} style={{ color: styleItem?.color }}>
                          {getEventTimeStr(e)}
                        </div>
                        <div className={styles.eventBlockTitle}>{e.title}</div>
                        {e.status && (
                          <div className={styles.eventBlockStatus}>{e.status}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Current time line indicator */}
              {isToday && currentHour >= HOURS[0] && currentHour <= HOURS[HOURS.length - 1] + 1 && (
                <div
                  className={styles.currentTimeLine}
                  style={{ top: `${(currentHour - HOURS[0]) * HOUR_HEIGHT}px` }}
                >
                  <span className={styles.currentTimeDot} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>
      <PageHero icon={CalendarIcon} title="Calendar" subtitle="View events and tasks at a glance" />

      {/* Modern Action Bar & Tabs */}
      <div className={styles.topControlBar}>
        {/* Left Side Tab Navigation */}
        <div className={styles.tabNav}>
          <Tabs
            tabs={tabsList}
            activeTab={activeTab}
            onChange={(val) => setActiveTab(val)}
          />
        </div>

        {/* Right Side Tools */}
        <div className={styles.topActionGroup}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <Button variant="secondary" size="md" className={styles.toolBtn}>
            <Filter size={16} />
            Filter
          </Button>

          <Button variant="primary" size="md" className={styles.newBtn} onClick={() => navigate('/events/new')}>
            <Plus size={16} />
            New
          </Button>
        </div>
      </div>

      {/* Subheader Controls */}
      <div className={styles.subheader}>
        <div className={styles.navControls}>
          <button className={styles.iconNavBtn} onClick={prevPeriod}>
            <ChevronLeft size={18} />
          </button>
          <button className={styles.iconNavBtn} onClick={nextPeriod}>
            <ChevronRight size={18} />
          </button>
          <button className={styles.todayButton} onClick={goToday}>
            Today
          </button>
        </div>

        {/* Center view selector */}
        <div className={styles.viewToggleGroup}>
          {[
            { id: 'day', label: 'Day' },
            { id: 'week', label: 'Week' },
            { id: 'month', label: 'Month' }
          ].map(view => (
            <button
              key={view.id}
              className={`${styles.viewToggleBtn} ${activeView === view.id ? styles.viewToggleActive : ''}`}
              onClick={() => {
                setActiveView(view.id as any)
                setSelectedDate(null)
              }}
            >
              {view.label}
            </button>
          ))}
        </div>

        {/* Right Side date text */}
        <div className={styles.rangeIndicator}>
          <CalendarIcon size={16} className={styles.rangeCalIcon} />
          <span>{getRangeLabel()}</span>
        </div>
      </div>

      {/* Render selected view */}
      <div className={styles.calendarContent}>
        {activeView === 'month' && renderMonthView()}
        {activeView === 'week' && renderWeekView()}
        {activeView === 'day' && renderDayView()}
      </div>
    </div>
  )
}
