import { useState, useEffect } from 'react'
import { View, FlatList, Text, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface ActiveEvent {
  id: string
  name: string
  event_date: string | null
  venue_name: string | null
  status: string
}

export default function EventsScreen() {
  const [events, setEvents] = useState<ActiveEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setIsLoading(true)
    const { data } = await supabase
      .from('events')
      .select('id, name, event_date, venue_name, status')
      .in('status', ['active', 'in_progress'])
      .order('event_date', { ascending: true })
    if (data) setEvents(data)
    setIsLoading(false)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Select an event to open the live board</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/(app)/event/${item.id}/board`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardContent}>
              <Text style={styles.eventName}>{item.name}</Text>
              <Text style={styles.eventMeta}>
                {item.event_date ? new Date(item.event_date).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'long' }) : 'Date TBD'}
                {item.venue_name ? ` · ${item.venue_name}` : ''}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No active events</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  eventName: {
    color: colors.textPrimary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  eventMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: fontSize.titleLg,
    marginLeft: spacing[2],
  },
  empty: {
    color: colors.textMuted,
    fontSize: fontSize.base,
    textAlign: 'center',
    marginTop: spacing[12],
  },
})
