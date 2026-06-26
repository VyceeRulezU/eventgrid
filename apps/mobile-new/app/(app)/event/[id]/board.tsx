import { useState } from 'react'
import { View, FlatList, Text, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useLiveBoard } from '../../../../hooks/useLiveBoard'
import { StationCard } from '../../../../components/board/StationCard'
import { GuestCountBar } from '../../../../components/board/GuestCountBar'
import { StatusUpdateSheet } from '../../../../components/board/StatusUpdateSheet'
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../constants/tokens'

export default function LiveBoardScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { items, issues, guestCount, totalGuests, eventName, isLoading, refresh, updateStatus } = useLiveBoard(eventId!)

  const [selectedStation, setSelectedStation] = useState<{ id: string; name: string; status: string } | null>(null)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← Events</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.eventName} numberOfLines={1}>{eventName}</Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push(`/(app)/event/${eventId}/issues`)}
          style={styles.issuesBadge}
        >
          <Text style={styles.issuesBadgeText}>
            {issues.filter(i => !i.resolved_at).length}
          </Text>
        </TouchableOpacity>
      </View>

      <GuestCountBar checked={guestCount} total={totalGuests} />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StationCard
            item={item}
            issueCount={issues.filter(i => i.board_item_id === item.id && !i.resolved_at).length}
            onPress={() => setSelectedStation({ id: item.id, name: item.station_name, status: item.status })}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <StatusUpdateSheet
        visible={!!selectedStation}
        stationName={selectedStation?.name ?? ''}
        currentStatus={selectedStation?.status ?? 'grey'}
        onUpdate={(status, note) => {
          if (selectedStation) updateStatus(selectedStation.id, status, note)
        }}
        onClose={() => setSelectedStation(null)}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    width: 80,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[2],
  },
  eventName: {
    color: colors.textPrimary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.statusRed,
  },
  liveText: {
    color: colors.statusRed,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  issuesBadge: {
    backgroundColor: colors.statusRedBg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    minWidth: 80,
    alignItems: 'center',
  },
  issuesBadgeText: {
    color: colors.statusRed,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  list: {
    padding: spacing[4],
  },
  separator: {
    height: spacing[2],
  },
})
