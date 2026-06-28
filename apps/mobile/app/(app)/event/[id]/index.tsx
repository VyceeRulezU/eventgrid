import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Modal,
  RefreshControl,
  Dimensions,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
  TrendingUp,
} from 'lucide-react-native'
import { supabase } from '../../../../lib/supabase'
import { useAuthStore } from '@naligrid/shared'

const { width } = Dimensions.get('window')

interface EventPhase {
  id: string
  phase_name: string
  phase_number: number
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked'
  due_date: string | null
}

interface EventDetails {
  id: string
  name: string
  event_date: string | null
  venue_name: string | null
  status: string
}

export default function EventOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [event, setEvent] = useState<EventDetails | null>(null)
  const [phases, setPhases] = useState<EventPhase[]>([])
  const [taskCounts, setTaskCounts] = useState<Record<string, { total: number; done: number }>>({})
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Add Phase state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [adding, setAdding] = useState(false)

  // Auth checker
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    if (id) {
      loadEventData()
      checkUserAuthorization()
    }
  }, [id])

  const checkUserAuthorization = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user!.id)
        .single()

      const { data: access } = await supabase
        .from('event_access')
        .select('role')
        .eq('event_id', id)
        .eq('user_id', user!.id)
        .single()

      const isPlanner = profile?.role === 'planner' || profile?.role === 'super_admin'
      const isCoordinator = access?.role === 'coordinator'
      setCanManage(isPlanner || isCoordinator)
    } catch {
      setCanManage(false)
    }
  }

  const loadEventData = async () => {
    try {
      // 1. Fetch Event Info
      const { data: eventData } = await supabase
        .from('events')
        .select('id, name, event_date, venue_name, status')
        .eq('id', id)
        .single()

      if (eventData) setEvent(eventData)

      // 2. Fetch Event Phases
      const { data: phasesData } = await supabase
        .from('event_phases')
        .select('id, phase_name, phase_number, status, due_date')
        .eq('event_id', id)
        .order('phase_number', { ascending: true })

      if (phasesData) {
        setPhases(phasesData)

        // 3. Fetch Task counts for each phase
        const counts: Record<string, { total: number; done: number }> = {}
        await Promise.all(
          phasesData.map(async (phase) => {
            const { data: tasks } = await supabase
              .from('tasks')
              .select('status')
              .eq('phase_id', phase.id)

            const total = tasks?.length || 0
            const done = tasks?.filter(t => t.status === 'done').length || 0
            counts[phase.id] = { total, done }
          })
        )
        setTaskCounts(counts)
      }
    } catch (err) {
      console.log('Error loading event overview data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadEventData()
  }

  const togglePhaseStatus = async (phase: EventPhase) => {
    if (!canManage) return
    
    const isCompleted = phase.status === 'completed'
    try {
      if (isCompleted) {
        // Reopen phase via RPC
        await supabase.rpc('reopen_phase', { p_phase_id: phase.id })
      } else {
        // Complete phase via RPC
        await supabase.rpc('manually_complete_phase', { p_phase_id: phase.id })
      }
      loadEventData()
    } catch (err) {
      console.log('Error toggling phase status:', err)
    }
  }

  const handleAddPhase = async () => {
    const trimmedName = newPhaseName.trim()
    if (!trimmedName) return

    setAdding(true)
    try {
      const maxPhaseNum = phases.length > 0 ? Math.max(...phases.map(p => p.phase_number)) : 0
      
      const { error } = await supabase
        .from('event_phases')
        .insert({
          event_id: id,
          phase_name: trimmedName,
          phase_number: maxPhaseNum + 1,
          status: 'not_started'
        })

      if (error) throw error

      setNewPhaseName('')
      setShowAddModal(false)
      loadEventData()
    } catch (err) {
      console.log('Error inserting custom phase:', err)
    } finally {
      setAdding(false)
    }
  }

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={16} color="#22C55E" />
      case 'in_progress':
        return <Clock size={16} color="#EAB308" />
      case 'blocked':
        return <AlertTriangle size={16} color="#EF4444" />
      default:
        return <Circle size={16} color="#6B7280" />
    }
  }

  const getPhaseBadgeStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.badgeCompleted
      case 'in_progress':
        return styles.badgeCurrent
      case 'blocked':
        return styles.badgeBlocked
      default:
        return styles.badgeDefault
    }
  }

  const completedCount = phases.filter(p => p.status === 'completed').length
  const progressPct = phases.length > 0 ? Math.round((completedCount / phases.length) * 100) : 0

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/(app)/events')} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Project Milestones</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4A017" />
          }
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Event Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.eventName}>{event?.name}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Calendar size={13} color="#9CA3AF" />
                <Text style={styles.metaText}>
                  {event?.event_date
                    ? new Date(event.event_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })
                    : 'Date TBD'}
                </Text>
              </View>
              {event?.venue_name && (
                <View style={styles.metaItem}>
                  <MapPin size={13} color="#9CA3AF" />
                  <Text style={styles.metaText} numberOfLines={1}>{event.venue_name}</Text>
                </View>
              )}
            </View>

            {/* Overall Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressInfo}>
                <Text style={styles.progressLabel}>Phases Progress</Text>
                <Text style={styles.progressLabelVal}>{completedCount} of {phases.length} completed ({progressPct}%)</Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
            </View>

            {/* Quick Action Navigation Segment */}
            <TouchableOpacity
              style={styles.boardLinkBtn}
              onPress={() => router.push(`/(app)/event/${id}/tasks` as any)}
              activeOpacity={0.8}
            >
              <TrendingUp size={16} color="#111827" />
              <Text style={styles.boardLinkText}>Go to Task Board</Text>
              <ChevronRight size={16} color="#111827" />
            </TouchableOpacity>
          </View>

          {/* Phase Cards Grid */}
          <Text style={styles.sectionTitle}>Operational Phases</Text>
          
          <View style={styles.phasesGrid}>
            {phases.map((phase) => {
              const tc = taskCounts[phase.id] || { total: 0, done: 0 }
              const taskProgressPct = tc.total > 0 ? Math.round((tc.done / tc.total) * 100) : 0

              return (
                <View key={phase.id} style={[styles.phaseCard, getPhaseBadgeStyle(phase.status)]}>
                  <View style={styles.phaseCardTop}>
                    <Text style={styles.phaseCardNum}>Phase {phase.phase_number}</Text>
                    <TouchableOpacity
                      onPress={() => togglePhaseStatus(phase)}
                      disabled={!canManage}
                      activeOpacity={0.7}
                    >
                      {getPhaseIcon(phase.status)}
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.phaseCardName} numberOfLines={2}>{phase.phase_name}</Text>

                  <View style={styles.phaseCardStatusRow}>
                    <View style={[styles.phaseStatusDot, {
                      backgroundColor: phase.status === 'completed' ? '#22C55E' : phase.status === 'in_progress' ? '#EAB308' : phase.status === 'blocked' ? '#EF4444' : '#6B7280'
                    }]} />
                    <Text style={[styles.phaseStatusText, {
                      color: phase.status === 'completed' ? '#22C55E' : phase.status === 'in_progress' ? '#EAB308' : phase.status === 'blocked' ? '#EF4444' : '#9CA3AF'
                    }]}>
                      {phase.status.replace('_', ' ')}
                    </Text>
                  </View>

                  {tc.total > 0 && (
                    <View style={styles.phaseTasksContainer}>
                      <View style={styles.phaseTasksRow}>
                        <Text style={styles.phaseTasksLabel}>Tasks</Text>
                        <Text style={styles.phaseTasksVal}>{tc.done}/{tc.total} done</Text>
                      </View>
                      <View style={styles.phaseTasksTrack}>
                        <View style={[styles.phaseTasksFill, { width: `${taskProgressPct}%` }]} />
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.manageTasksLink}
                    onPress={() => router.push(`/(app)/event/${id}/tasks` as any)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.manageTasksLinkText}>
                      {canManage ? 'Manage Deliverables' : 'View Tasks'}
                    </Text>
                    <ChevronRight size={12} color="#D4A017" />
                  </TouchableOpacity>
                </View>
              )
            })}

            {/* Add Phase Card — same size as phase cards */}
            {canManage && (
              <TouchableOpacity
                style={styles.addPhaseCard}
                onPress={() => setShowAddModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.addPhaseIconWrap}>
                  <Plus size={24} color="#D4A017" />
                </View>
                <Text style={styles.addPhaseTitle}>Add a Phase</Text>
                <Text style={styles.addPhaseSub}>Create a new operational phase</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}

      {/* Add Custom Phase Modal */}
      <Modal visible={showAddModal} animationType="fade" transparent={true} onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Phase</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter phase name"
              placeholderTextColor="#6B7280"
              value={newPhaseName}
              onChangeText={setNewPhaseName}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => { setShowAddModal(false); setNewPhaseName('') }}
                disabled={adding}
              >
                <Text style={styles.modalBtnTextSec}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleAddPhase}
                disabled={adding || !newPhaseName.trim()}
              >
                {adding ? (
                  <ActivityIndicator color="#111827" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextPrim}>Add Phase</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
  },
  detailsCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  eventName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressSection: {
    width: '100%',
    marginBottom: 18,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  progressLabelVal: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4A017',
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 2,
  },
  boardLinkBtn: {
    flexDirection: 'row',
    backgroundColor: '#D4A017',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  boardLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  phasesGrid: {
    gap: 16,
    marginBottom: 24,
  },
  phaseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#374151',
    padding: 16,
    minHeight: 180,
  },
  badgeCompleted: {
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  badgeCurrent: {
    borderColor: 'rgba(212, 160, 23, 0.25)',
  },
  badgeBlocked: {
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  badgeDefault: {
    borderColor: '#374151',
  },
  phaseCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  phaseCardNum: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phaseCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  phaseStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  phaseStatusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  phaseCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 12,
  },
  phaseTasksContainer: {
    width: '100%',
    marginBottom: 12,
  },
  phaseTasksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  phaseTasksLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
  },
  phaseTasksVal: {
    fontSize: 9,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  phaseTasksTrack: {
    height: 3,
    backgroundColor: '#374151',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  phaseTasksFill: {
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 1.5,
  },
  manageTasksLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  manageTasksLinkText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4A017',
  },
  addPhaseCard: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#374151',
    padding: 16,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addPhaseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhaseTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D4A017',
    marginTop: 4,
  },
  addPhaseSub: {
    fontSize: 12,
    color: '#6B7280',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 24,
    gap: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalInput: {
    height: 48,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnSecondary: {
    backgroundColor: '#374151',
  },
  modalBtnPrimary: {
    backgroundColor: '#D4A017',
  },
  modalBtnTextSec: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalBtnTextPrim: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '700',
  },
})
