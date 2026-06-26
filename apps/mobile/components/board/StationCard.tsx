import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { StatusDot } from '../ui/StatusDot'
import { Badge } from '../ui/Badge'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'
import type { StatusLevel } from '@naligrid/shared'

export interface LiveBoardItem {
  id: string
  station_name: string
  status: string
  status_label: string | null
}

interface Props {
  item: LiveBoardItem
  issueCount: number
  onPress: () => void
}

export function StationCard({ item, issueCount, onPress }: Props) {
  const statusLevel = (['green', 'yellow', 'red', 'grey'] as StatusLevel[]).includes(item.status as StatusLevel)
    ? item.status as StatusLevel
    : 'grey'

  return (
    <TouchableOpacity
      style={[styles.card, item.status === 'red' && styles.cardRed]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <StatusDot status={statusLevel} />

      <View style={styles.content}>
        <Text style={styles.stationName}>{item.station_name}</Text>
        <Text style={styles.statusLabel}>
          {item.status_label || item.status}
        </Text>
      </View>

      <View style={styles.right}>
        {issueCount > 0 && <Badge count={issueCount} />}
        <ChevronRight size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    minHeight: 64,
  },
  cardRed: {
    borderColor: colors.statusRed,
  },
  content: {
    flex: 1,
    marginLeft: spacing[3],
  },
  stationName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  statusLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
})
