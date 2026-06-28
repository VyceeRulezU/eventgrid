import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  StatusBar,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Circle,
  ChevronRight,
  Filter,
  User,
} from 'lucide-react-native'
import { supabase } from '../../../../lib/supabase'
import { useAuthStore } from '@naligrid/shared'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'done' | 'blocked'
  phase_id: string | null
  assignee_id: string | null
  due_datetime: string | null
  assignee?: { display_name: string | null; avatar_url: string | null } | null
}

interface EventPhase {
  id: string
  phase_name: string
  phase_number: number
}

interface TeamMember {
  user_id: string
  display_name: string | null
}

const STATUSES = [
  { key: 'pending', label: 'Pending', icon: Circle, color: '#6B7280' },
  { key: 'in_progress', label: 'In Progress', icon: Clock, color: '#EAB308' },
  { key: 'blocked', label: 'Blocked', icon: AlertTriangle, color: '#EF4444' },
  { key: 'done', label: 'Done', icon: CheckCircle2, color: '#22C55E' },
] as const

export default function EventTasksScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [phases, setPhases] = useState<EventPhase[]>([])
  const [members, setMembers] = useState<TeamMember[]>([])

  // Filters
  const [activeStatus, setActiveStatus] = useState<Task['status']>('pending')
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>('all')

  // Create Task Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDesc, setNewTaskDesc] = useState('')
  const [newTaskPhase, setNewTaskPhase] = useState('')
  const [newTaskAssignee, setNewTaskAssignee] = useState('')
  const [creating, setCreating] = useState(false)

  // Edit Task Modal / Detail state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Auth checker
  const [canManage, setCanManage] = useState(false)

  useEffect(() => {
    if (eventId) {
      loadBoardData()
      checkUserAuthorization()
    }
  }, [eventId])

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
        .eq('event_id', eventId)
        .eq('user_id', user!.id)
        .single()

      const isPlanner = profile?.role === 'planner' || profile?.role === 'super_admin'
      const isCoordinator = access?.role === 'coordinator'
      setCanManage(isPlanner || isCoordinator)
    } catch {
      setCanManage(false)
    }
  }

  const loadBoardData = async () => {
    try {
      // 1. Fetch Tasks
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*, assignee:profiles!tasks_assignee_id_fkey(display_name, avatar_url)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })

      if (tasksData) setTasks(tasksData as unknown as Task[])

      // 2. Fetch Phases
      const { data: phasesData } = await supabase
        .from('event_phases')
        .select('id, phase_name, phase_number')
        .eq('event_id', eventId)
        .order('phase_number')

      if (phasesData) {
        setPhases(phasesData)
        if (phasesData.length > 0 && !newTaskPhase) {
          setNewTaskPhase(phasesData[0].id)
        }
      }

      // 3. Fetch Event Access users
      const { data: accessData } = await supabase
        .from('event_access')
        .select('user_id')
        .eq('event_id', eventId)

      if (accessData && accessData.length > 0) {
        const userIds = accessData.map(r => r.user_id)
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds)

        if (profiles) setMembers(profiles.map(p => ({ user_id: p.id, display_name: p.display_name })))
      }
    } catch (err) {
      console.log('Error loading tasks board data:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadBoardData()
  }

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !newTaskPhase) return

    setCreating(true)
    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          event_id: eventId,
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || null,
          phase_id: newTaskPhase,
          assignee_id: newTaskAssignee || null,
          status: 'pending',
        })

      if (error) throw error

      setNewTaskTitle('')
      setNewTaskDesc('')
      setNewTaskAssignee('')
      setShowCreateModal(false)
      loadBoardData()
    } catch (err) {
      console.log('Error creating task:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, newStatus: Task['status']) => {
    setUpdatingStatus(true)
    try {
      const updatePayload: any = { status: newStatus }
      if (newStatus === 'done') {
        updatePayload.completed_at = new Date().toISOString()
      } else {
        updatePayload.completed_at = null
      }

      const { error } = await supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', taskId)

      if (error) throw error

      setSelectedTask(null)
      loadBoardData()
    } catch (err) {
      console.log('Error updating task status:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Filter logic
  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = t.status === activeStatus
    const matchesPhase = selectedPhaseId === 'all' || t.phase_id === selectedPhaseId
    return matchesStatus && matchesPhase
  })

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Deliverables Checklist</Text>
        {canManage ? (
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreateModal(true)} activeOpacity={0.7}>
            <Plus size={20} color="#D4A017" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Status tabs selector (Pending, In Progress, Blocked, Done) */}
      <View style={styles.tabsContainer}>
        {STATUSES.map((st) => {
          const count = tasks.filter((t) => t.status === st.key && (selectedPhaseId === 'all' || t.phase_id === selectedPhaseId)).length
          const active = activeStatus === st.key
          return (
            <TouchableOpacity
              key={st.key}
              style={[styles.tabButton, active && styles.tabButtonActive]}
              onPress={() => setActiveStatus(st.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {st.label} ({count})
              </Text>
              {active && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Phase Filter Row */}
      <View style={styles.filterRow}>
        <Filter size={12} color="#9CA3AF" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedPhaseId === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedPhaseId('all')}
          >
            <Text style={[styles.filterChipText, selectedPhaseId === 'all' && styles.filterChipTextActive]}>All Phases</Text>
          </TouchableOpacity>
          {phases.map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.filterChip, selectedPhaseId === p.id && styles.filterChipActive]}
              onPress={() => setSelectedPhaseId(p.id)}
            >
              <Text style={[styles.filterChipText, selectedPhaseId === p.id && styles.filterChipTextActive]}>
                P{p.phase_number}: {p.phase_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#D4A017" />
        </View>
      ) : (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.taskCard}
              onPress={() => setSelectedTask(item)}
              activeOpacity={0.8}
            >
              <View style={styles.taskCardLeft}>
                <Text style={styles.taskTitle}>{item.title}</Text>
                {item.description ? (
                  <Text style={styles.taskDesc} numberOfLines={2}>{item.description}</Text>
                ) : null}

                {/* Meta row */}
                <View style={styles.taskMeta}>
                  {item.assignee?.display_name ? (
                    <View style={styles.metaItem}>
                      <User size={10} color="#9CA3AF" />
                      <Text style={styles.metaText}>{item.assignee.display_name}</Text>
                    </View>
                  ) : (
                    <View style={styles.metaItem}>
                      <User size={10} color="#6B7280" />
                      <Text style={[styles.metaText, { color: '#6B7280' }]}>Unassigned</Text>
                    </View>
                  )}
                  {item.due_datetime && (
                    <Text style={styles.metaDate}>
                      Due: {new Date(item.due_datetime).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                    </Text>
                  )}
                </View>
              </View>
              <ChevronRight size={14} color="#4B5563" />
            </TouchableOpacity>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#D4A017" />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks under this section</Text>
          }
        />
      )}

      {/* Task Details & Status Change Modal */}
      <Modal visible={!!selectedTask} animationType="fade" transparent={true} onRequestClose={() => setSelectedTask(null)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedTask?.title}</Text>
            <Text style={styles.modalDesc}>{selectedTask?.description || 'No description provided.'}</Text>
            
            <View style={styles.detailsGrid}>
              <Text style={styles.detailsLabel}>Assignee: <Text style={styles.detailsValue}>{selectedTask?.assignee?.display_name || 'Unassigned'}</Text></Text>
              {selectedTask?.due_datetime && (
                <Text style={styles.detailsLabel}>Due Date: <Text style={styles.detailsValue}>{new Date(selectedTask.due_datetime).toLocaleDateString()}</Text></Text>
              )}
            </View>

            <Text style={styles.modalSubTitle}>Update Status</Text>
            <View style={styles.statusOptions}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st.key}
                  style={[
                    styles.statusBtn,
                    selectedTask?.status === st.key && { borderColor: st.color, backgroundColor: 'rgba(255,255,255,0.03)' },
                  ]}
                  onPress={() => selectedTask && handleUpdateTaskStatus(selectedTask.id, st.key)}
                  disabled={!canManage || updatingStatus}
                  activeOpacity={0.7}
                >
                  <st.icon size={14} color={st.color} />
                  <Text style={[styles.statusBtnText, { color: selectedTask?.status === st.key ? '#FFFFFF' : '#9CA3AF' }]}>
                    {st.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setSelectedTask(null)}
              disabled={updatingStatus}
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={showCreateModal} animationType="fade" transparent={true} onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Task Title</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="What needs to be done?"
                placeholderTextColor="#6B7280"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top', paddingTop: 10 }]}
                placeholder="Add optional task details..."
                placeholderTextColor="#6B7280"
                value={newTaskDesc}
                onChangeText={setNewTaskDesc}
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phase Milestone</Text>
              <View style={styles.selectWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  {phases.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.selectChip, newTaskPhase === p.id && styles.selectChipActive]}
                      onPress={() => setNewTaskPhase(p.id)}
                    >
                      <Text style={[styles.selectChipText, newTaskPhase === p.id && styles.selectChipTextActive]}>
                        P{p.phase_number}: {p.phase_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Assign Team Member</Text>
              <View style={styles.selectWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                  <TouchableOpacity
                    style={[styles.selectChip, !newTaskAssignee && styles.selectChipActive]}
                    onPress={() => setNewTaskAssignee('')}
                  >
                    <Text style={[styles.selectChipText, !newTaskAssignee && styles.selectChipTextActive]}>Unassigned</Text>
                  </TouchableOpacity>
                  {members.map((m) => (
                    <TouchableOpacity
                      key={m.user_id}
                      style={[styles.selectChip, newTaskAssignee === m.user_id && styles.selectChipActive]}
                      onPress={() => setNewTaskAssignee(m.user_id)}
                    >
                      <Text style={[styles.selectChipText, newTaskAssignee === m.user_id && styles.selectChipTextActive]}>
                        {m.display_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => { setShowCreateModal(false); setNewTaskTitle('') }}
                disabled={creating}
              >
                <Text style={styles.modalBtnTextSec}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={handleCreateTask}
                disabled={creating || !newTaskTitle.trim() || !newTaskPhase}
              >
                {creating ? (
                  <ActivityIndicator color="#111827" size="small" />
                ) : (
                  <Text style={styles.modalBtnTextPrim}>Create Task</Text>
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
  addBtn: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabButtonActive: {},
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tabLabelActive: {
    color: '#D4A017',
    fontWeight: '700',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#D4A017',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#111827',
    borderBottomWidth: 1,
    borderColor: '#1F2937',
    gap: 8,
  },
  filterScroll: {
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 14,
  },
  filterChipActive: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  filterChipText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#D4A017',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  separator: {
    height: 10,
  },
  taskCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskCardLeft: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  taskDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 16,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  metaDate: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    marginTop: 80,
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
    gap: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalDesc: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  detailsGrid: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsValue: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  statusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statusBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  closeModalBtn: {
    height: 40,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  modalInput: {
    height: 44,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 14,
    color: '#FFFFFF',
    fontSize: 13,
  },
  selectWrapper: {
    height: 38,
    justifyContent: 'center',
  },
  selectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
  },
  selectChipActive: {
    borderColor: '#D4A017',
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
  },
  selectChipText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  selectChipTextActive: {
    color: '#D4A017',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    height: 42,
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
    fontSize: 13,
    fontWeight: '600',
  },
  modalBtnTextPrim: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '700',
  },
})
