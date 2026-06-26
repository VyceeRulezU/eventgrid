import { View, FlatList, Text, StyleSheet, RefreshControl } from 'react-native'
import { useAuthStore } from '@naligrid/shared'
import { useMyTasks } from '../../hooks/useMyTasks'
import { TaskRow } from '../../components/tasks/TaskRow'
import { colors, spacing, fontSize, fontWeight } from '../../constants/tokens'

export default function TasksScreen() {
  const { user } = useAuthStore()
  const { pendingTasks, isLoading, refresh, markDone } = useMyTasks(user?.id ?? '')

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>
        <Text style={styles.subtitle}>{pendingTasks.length} pending</Text>
      </View>

      <FlatList
        data={pendingTasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TaskRow item={item} onMarkDone={() => markDone(item.id)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No pending tasks</Text>
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
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing[12],
  },
})
