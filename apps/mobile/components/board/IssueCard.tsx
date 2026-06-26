import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

export interface IssueItem {
  id: string
  title: string
  description: string | null
  severity: string
  raised_by: string
  raised_at: string
  resolved_at: string | null
  resolution: string | null
}

interface Props {
  item: IssueItem
  onResolve?: () => void
}

const severityColors: Record<string, string> = {
  critical: colors.statusRed,
  high: colors.statusYellow,
  medium: colors.statusYellow,
  low: colors.textMuted,
}

export function IssueCard({ item, onResolve }: Props) {
  const isResolved = !!item.resolved_at
  const sevColor = severityColors[item.severity] || colors.textMuted

  return (
    <View style={[styles.card, isResolved && styles.resolved]}>
      <View style={[styles.severityBar, { backgroundColor: isResolved ? colors.surface3 : sevColor }]} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.severity, { color: sevColor }]}>
            {item.severity.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.title, isResolved && styles.titleResolved]}>{item.title}</Text>
        {item.description ? <Text style={styles.description}>{item.description}</Text> : null}
        <Text style={styles.meta}>
          Raised by {item.raised_by} · {new Date(item.raised_at).toLocaleTimeString()}
        </Text>
        {isResolved && item.resolution ? (
          <Text style={styles.resolution}>Resolved: {item.resolution}</Text>
        ) : null}
      </View>

      {!isResolved && onResolve ? (
        <TouchableOpacity style={styles.resolveBtn} onPress={onResolve}>
          <Text style={styles.resolveText}>Resolve</Text>
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
  resolved: {
    opacity: 0.6,
  },
  severityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  severity: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  titleResolved: {
    textDecorationLine: 'line-through',
  },
  description: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing[1],
  },
  meta: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  resolution: {
    color: colors.statusGreen,
    fontSize: fontSize.xs,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  resolveBtn: {
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  resolveText: {
    color: colors.accent,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
})
