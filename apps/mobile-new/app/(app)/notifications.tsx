import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native'
import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@naligrid/shared'
import { supabase } from '../../lib/supabase'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface NotificationItem {
  id: string
  title: string
  body: string | null
  type: string
  is_read: boolean
  created_at: string
}

export default function NotificationsScreen() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return
    setIsLoading(true)
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) setNotifications(data)
    setIsLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>{notifications.filter(n => !n.is_read).length} unread</Text>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.is_read && styles.unread]}>
            <Text style={styles.notifTitle}>{item.title}</Text>
            {item.body ? <Text style={styles.notifBody}>{item.body}</Text> : null}
            <Text style={styles.notifTime}>
              {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString()}
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchNotifications} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No notifications yet</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
  },
  header: {
    paddingTop: spacing[12],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.titleLg,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing[1],
  },
  list: {
    padding: spacing[4],
  },
  separator: {
    height: spacing[2],
  },
  card: {
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
  },
  unread: {
    borderColor: colors.accent,
  },
  notifTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  notifBody: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  notifTime: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing[1],
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing[12],
  },
})
