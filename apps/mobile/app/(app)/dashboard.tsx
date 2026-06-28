import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Calendar,
  ListChecks,
  DollarSign,
  Bell,
  Plus,
  QrCode,
  LogOut,
  ChevronRight,
  Sparkles,
  User,
  Settings,
} from 'lucide-react-native'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius, fontSize, fontWeight } from '../../constants/tokens'

const { width } = Dimensions.get('window')

export default function DashboardScreen() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  // Live Stats
  const [stats, setStats] = useState({
    eventsCount: 0,
    tasksCount: 0,
    notificationsCount: 0,
    budgetSpent: 0,
  })

  // Recent tasks/events
  const [recentActivities, setRecentActivities] = useState<any[]>([])

  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // 1. Fetch Events Count
      const { count: evCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })

      // 2. Fetch Assigned Pending Tasks Count
      const { count: tCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', user!.id)
        .neq('status', 'done')

      // 3. Fetch Notifications Count
      const { count: notCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false)

      // 4. Fetch Budget Allocations (spent sum)
      const { data: budgetData } = await supabase
        .from('events')
        .select('total_budget')
        .limit(10)

      const totalBudgetSum = budgetData?.reduce((acc, curr) => acc + (curr.total_budget || 0), 0) || 0

      // 5. Fetch Recent Activities/logs
      const { data: activityData } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(3)

      setStats({
        eventsCount: evCount || 0,
        tasksCount: tCount || 0,
        notificationsCount: notCount || 0,
        budgetSpent: totalBudgetSum,
      })

      setRecentActivities(activityData || [])
    } catch (err) {
      console.log('Error fetching dashboard stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    clearAuth()
    router.replace('/(auth)/welcome')
  }

  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getGreeting = () => {
    const hrs = new Date().getHours()
    if (hrs < 12) return 'Good Morning'
    if (hrs < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.userName}>
            {(user?.user_metadata?.display_name as string) || 'Event Professional'}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(app)/profile')} activeOpacity={0.7}>
          <User size={20} color="#D4A017" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#D4A017" />
          </View>
        ) : (
          <>
            {/* Financial Summary Card */}
            <View style={styles.financialCard}>
              <View style={styles.financialCardHeader}>
                <View style={styles.flexRow}>
                  <Sparkles size={16} color="#D4A017" style={styles.sparkleIcon} />
                  <Text style={styles.financialLabel}>Total Portfolio Budget</Text>
                </View>
                <Text style={styles.nairaValue}>{formatNaira(stats.budgetSpent)}</Text>
              </View>
              <View style={styles.financialProgressTrack}>
                <View style={styles.financialProgressFill} />
              </View>
              <Text style={styles.financialFooter}>Across all operational events</Text>
            </View>

            {/* Quick Actions Panel */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(app)/events')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(212, 160, 23, 0.1)' }]}>
                  <Plus size={20} color="#D4A017" />
                </View>
                <Text style={styles.actionText}>Add Event</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(app)/tasks')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.1)' }]}>
                  <ListChecks size={20} color="#22C55E" />
                </View>
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push('/(app)/check-in')}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <QrCode size={20} color="#3B82F6" />
                </View>
                <Text style={styles.actionText}>Scan QR</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Dashboard Grid */}
            <Text style={styles.sectionTitle}>Overview Status</Text>
            <View style={styles.statsGrid}>
              {/* Stat 1 */}
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(app)/events')}
                activeOpacity={0.8}
              >
                <View style={styles.statHeader}>
                  <Calendar size={16} color="#D4A017" />
                  <Text style={styles.statTitle}>Active Projects</Text>
                </View>
                <Text style={styles.statNum}>{stats.eventsCount}</Text>
              </TouchableOpacity>

              {/* Stat 2 */}
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(app)/tasks')}
                activeOpacity={0.8}
              >
                <View style={styles.statHeader}>
                  <ListChecks size={16} color="#22C55E" />
                  <Text style={styles.statTitle}>My Tasks</Text>
                </View>
                <Text style={styles.statNum}>{stats.tasksCount}</Text>
              </TouchableOpacity>

              {/* Stat 3 */}
              <TouchableOpacity
                style={styles.statCard}
                onPress={() => router.push('/(app)/notifications')}
                activeOpacity={0.8}
              >
                <View style={styles.statHeader}>
                  <Bell size={16} color="#EF4444" />
                  <Text style={styles.statTitle}>Alerts</Text>
                </View>
                <Text style={styles.statNum}>{stats.notificationsCount}</Text>
              </TouchableOpacity>

              {/* Stat 4 */}
              <View style={styles.statCard}>
                <View style={styles.statHeader}>
                  <DollarSign size={16} color="#3B82F6" />
                  <Text style={styles.statTitle}>Approvals</Text>
                </View>
                <Text style={styles.statNum}>0</Text>
              </View>
            </View>

            {/* Recent Notifications / Activities */}
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            <View style={styles.activityCard}>
              {recentActivities.length === 0 ? (
                <Text style={styles.emptyActivity}>No recent notification updates</Text>
              ) : (
                recentActivities.map((act) => (
                  <View key={act.id} style={styles.activityItem}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{act.title}</Text>
                      <Text style={styles.activityBody}>{act.body}</Text>
                    </View>
                    <ChevronRight size={14} color="#4B5563" />
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // var(--color-bg-base)
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#1F2937',
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  greetingText: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  profileBtn: {
    padding: 8,
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
    borderRadius: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  loaderContainer: {
    paddingTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  financialCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(212, 160, 23, 0.18)',
    padding: 20,
    marginBottom: 24,
  },
  financialCardHeader: {
    marginBottom: 14,
  },
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sparkleIcon: {
    marginRight: 6,
  },
  financialLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  nairaValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  financialProgressTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 10,
  },
  financialProgressFill: {
    width: '65%',
    height: '100%',
    backgroundColor: '#D4A017',
    borderRadius: 2,
  },
  financialProgressFillWrap: {
    borderRadius: 2,
    overflow: 'hidden',
  },
  financialFooter: {
    fontSize: 11,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 26,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 26,
  },
  statCard: {
    width: (width - 52) / 2,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statTitle: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statNum: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  activityCard: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  emptyActivity: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D4A017',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activityBody: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
})
