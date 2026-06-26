import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

export interface TaskItem {
  id: string
  title: string
  status: string
  due_datetime: string | null
  priority: string
}

interface Props {
  item: TaskItem
  onMarkDone: () => void
}

const priorityColors: Record<string, string> = {
  urgent: colors.statusRed,
  high: colors.statusYellow,
  medium: colors.statusGreen,
  low: colors.textMuted,
}

export function TaskRow({ item, onMarkDone }: Props) {
  const isOverdue = item.due_datetime && new Date(item.due_datetime) < new Date() && item.status !== 'done'

  return (
    <View style={[styles.card, isOverdue && styles.overdue]}>
      <View style={[styles.priorityBar, { backgroundColor: priorityColors[item.priority] || colors.textMuted }]} />

      <View style={styles.content}>
        <Text style={[styles.title, item.status === 'done' && styles.done]}>{item.title}</Text>
        {item.due_datetime ? (
          <Text style={[styles.due, isOverdue && styles.overdueText]}>
            Due {new Date(item.due_datetime).toLocaleTimeString()}
          </Text>
        ) : null}
      </View>

      {item.status !== 'done' ? (
        <TouchableOpacity style={styles.doneBtn} onPress={onMarkDone}>
          <Text style={styles.doneText}>Done</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  overdue: {
    borderColor: colors.statusRed,
  },
  priorityBar: {
    width: 3,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  done: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  due: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  overdueText: {
    color: colors.statusRed,
  },
  doneBtn: {
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  doneText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
})
