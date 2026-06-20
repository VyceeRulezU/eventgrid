import { useState, useEffect } from 'react'
import { Calendar, X, Loader2, UserCheck, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUIStore } from '@/store/ui.store'
import { generateSlug } from '@/lib/slug'
import { CalendarModal } from '@/components/ui/CalendarModal'
import { DropdownMenu, type DropdownItem } from '@/components/ui/DropdownMenu'

const EVENT_TYPES = [
  'Wedding', 'Corporate Event', 'Birthday', 'Naming Ceremony',
  'Anniversary', 'Graduation', 'Private Party', 'Conference',
  'Fashion Show', 'Product Launch', 'Other',
] as const

interface AssigneeOption {
  id: string
  display_name: string
  email: string
  role: string
}

interface Props {
  onClose: () => void
}

export function AdminCreateEventModal({ onClose }: Props) {
  const showToast = useUIStore((s) => s.showToast)

  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [users, setUsers] = useState<AssigneeOption[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [showCalendar, setShowCalendar] = useState(false)

  const [name, setName] = useState('')
  const [eventType, setEventType] = useState(EVENT_TYPES[0])
  const [eventDate, setEventDate] = useState('')
  const [venueName, setVenueName] = useState('')
  const [guestCount, setGuestCount] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        setAssigneeId(user.id)
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .in('role', ['planner', 'coordinator'])
        .order('role', { ascending: true })
      if (profiles) {
        setUsers(profiles.filter(p => p.role === 'planner' || p.role === 'coordinator'))
      }
      setLoadingUsers(false)
    }
    init()
  }, [])

  async function ensureOrg(userId: string): Promise<string | null> {
    const { data: ownedOrgs } = await supabase
      .from('organizations')
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
    if (ownedOrgs && ownedOrgs.length > 0) return ownedOrgs[0].id

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', userId)
      .single()

    const { data: newOrg } = await supabase.rpc('create_org', {
      p_name: `${profile?.display_name || 'User'}'s Events`,
      p_owner_id: userId,
      p_city: 'Lagos, Lagos',
      p_logo_url: null,
    })
    if (!newOrg) return null

    await supabase.from('profiles').update({ org_id: newOrg as string }).eq('id', userId)
    return newOrg as string
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      showToast({ type: 'error', title: 'Missing fields', body: 'Event name is required.' })
      return
    }
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const orgId = await ensureOrg(user.id)
      if (!orgId) throw new Error('Could not create organization')

      const targetId = assigneeId || user.id

      const { error } = await supabase.from('events').insert({
        org_id: orgId,
        created_by: user.id,
        name: name.trim(),
        event_type: eventType,
        event_date: eventDate || null,
        venue_name: venueName.trim() || null,
        guest_count: guestCount ? parseInt(guestCount, 10) : null,
        coordinator_id: targetId !== user.id ? targetId : null,
        status: 'active',
        payment_status: 'paid',
        amount_paid: 0,
        slug: generateSlug(name),
      })

      if (error) throw error

      showToast({ type: 'success', title: 'Event created', body: `"${name.trim()}" has been created and assigned.` })
      onClose()
    } catch (err) {
      showToast({ type: 'error', title: 'Failed to create event', body: err instanceof Error ? err.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  const typeItems: DropdownItem[] = EVENT_TYPES.map(t => ({ label: t, value: t }))

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      padding: 'var(--space-4)',
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 24,
        width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
        }}>
          <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <UserCheck size={18} style={{ color: 'var(--color-accent)' }} />
            Create Event
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost" style={{ padding: 6, lineHeight: 0 }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 'var(--space-5)' }}>
          <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label" htmlFor="modal-event-name">Event Name *</label>
            <input id="modal-event-name" type="text" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Adebayo & Folake Wedding" required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
            <div className="input-wrapper">
              <label className="input-label">Event Type *</label>
              <DropdownMenu
                trigger={<span>{eventType}</span>}
                items={typeItems}
                onSelect={(item) => setEventType(item.value)}
              />
            </div>
            <div className="input-wrapper" style={{ position: 'relative' }}>
              <label className="input-label">Assign To</label>
              {loadingUsers ? (
                <div className="skeleton skeleton-text" style={{ height: 40, borderRadius: 'var(--radius-md)' }} />
              ) : assigneeId ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', background: 'var(--color-surface-2)' }}>
                  <span style={{ flex: 1, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                    {assigneeId === currentUserId ? 'Myself (super admin)' : users.find(u => u.id === assigneeId) ? `${users.find(u => u.id === assigneeId)!.display_name || users.find(u => u.id === assigneeId)!.email}` : ''}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '1px 6px', borderRadius: 'var(--radius-md)' }}>
                    {assigneeId === currentUserId ? 'Super Admin' : users.find(u => u.id === assigneeId)?.role === 'planner' ? 'Planner' : 'Coordinator'}
                  </span>
                  <button type="button" onClick={() => { setAssigneeId(''); setSearchQuery('') }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: 2, lineHeight: 0 }}><X size={14} /></button>
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true) }}
                    onFocus={() => setShowResults(true)}
                    placeholder="Search planners & coordinators..."
                    autoComplete="off"
                  />
                  {showResults && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowResults(false)} />
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, marginTop: 4, background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                        {[
                          { id: currentUserId, display_name: 'Myself', email: '', role: 'super_admin' },
                          ...users.filter(u => !searchQuery || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())),
                        ].map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => { setAssigneeId(u.id); setSearchQuery(''); setShowResults(false) }}
                            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', padding: 'var(--space-2) var(--space-3)', background: 'none', border: 'none', borderBottom: '1px solid var(--color-border-subtle)', cursor: 'pointer', textAlign: 'left', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}
                          >
                            <span style={{ flex: 1 }}>{u.display_name || u.email || 'Myself'}</span>
                            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-surface-3)', padding: '1px 6px', borderRadius: 'var(--radius-md)', whiteSpace: 'nowrap' }}>
                              {u.role === 'planner' ? 'Planner' : u.role === 'coordinator' ? 'Coordinator' : 'Super Admin'}
                            </span>
                          </button>
                        ))}
                        {users.filter(u => !searchQuery || u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                          <div style={{ padding: 'var(--space-3)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>No matches found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="input-wrapper" style={{ marginBottom: 'var(--space-4)' }}>
            <label className="input-label" htmlFor="modal-venue-name">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                <MapPin size={12} /> Venue
              </span>
            </label>
            <input id="modal-venue-name" type="text" className="input" value={venueName} onChange={(e) => setVenueName(e.target.value)} placeholder="e.g. Eko Convention Centre, Victoria Island" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
            <div className="input-wrapper">
              <label className="input-label">Event Date</label>
              <button type="button" className="input" onClick={() => setShowCalendar(true)}
                style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: eventDate ? 'inherit' : 'var(--color-text-muted)' }}>
                <Calendar size={14} />
                {eventDate ? new Date(eventDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select date'}
              </button>
              <CalendarModal open={showCalendar} value={eventDate} onChange={(d) => { setEventDate(d); setShowCalendar(false) }} onClose={() => setShowCalendar(false)} />
            </div>
            <div className="input-wrapper">
              <label className="input-label" htmlFor="modal-guest-count">Guests</label>
              <input id="modal-guest-count" type="number" className="input" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 200" min={0} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}>
              {loading ? <Loader2 size={16} className="spin" /> : <UserCheck size={16} />}
              {loading ? 'Creating...' : 'Create & Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
