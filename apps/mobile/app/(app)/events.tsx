import React, { useState, useEffect } from 'react'
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Search, Calendar, MapPin, ChevronRight } from 'lucide-react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

interface ActiveEvent {
  id: string
  name: string
  event_date: string | null
  venue_name: string | null
  status: string
  completed_phases: number
  total_phases: number
}

export default function EventsScreen() {
  const [events, setEvents] = useState<ActiveEvent[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      // 1. Fetch Events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, name, event_date, venue_name, status')
        .in('status', ['active', 'in_progress'])
        .order('event_date', { ascending: true })

      if (eventsError) throw eventsError

      if (eventsData) {
        // 2. Fetch completed phases for each event to calculate progress
        const updatedEvents = await Promise.all(
          eventsData.map(async (ev) => {
            const { data: phases } = await supabase
              .from('event_phases')
              .select('status')
              .eq('event_id', ev.id)

            const totalPhases = phases?.length || 9
            const completedPhases = phases?.filter(p => p.status === 'completed').length || 0

            return {
              ...ev,
              completed_phases: completedPhases,
              total_phases: totalPhases,
            }
          })
        )
        setEvents(updatedEvents)
      }
    } catch (err) {
      console.log('Error fetching events list:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter events based on search query
  const filteredEvents = events.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Projects Directory</Text>
        <Text style={styles.subtitle}>Select a project to manage its phases & tasks</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Search size={16} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* FlatList */}
      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const progressPct = item.total_phases > 0
            ? Math.round((item.completed_phases / item.total_phases) * 100)
            : 0

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/event/${item.id}` as any)}
              activeOpacity={0.75}
            >
              <View style={styles.cardContent}>
                <Text style={styles.eventName}>{item.name}</Text>
                
                {/* Meta details */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Calendar size={12} color="#9CA3AF" />
                    <Text style={styles.metaText}>
                      {item.event_date
                        ? new Date(item.event_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                        : 'Date TBD'}
                    </Text>
                  </View>
                  {item.venue_name && (
                    <View style={styles.metaItem}>
                      <MapPin size={12} color="#9CA3AF" />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.venue_name}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Phase Progress</Text>
                    <Text style={styles.progressValue}>
                      {item.completed_phases}/{item.total_phases} complete ({progressPct}%)
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                  </View>
                </View>
              </View>
              <ChevronRight size={18} color="#4B5563" style={styles.chevron} />
            </TouchableOpacity>
          )
        }}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={fetchEvents} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No projects found</Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // var(--color-bg-base)
  },
  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1F2937',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#111827',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  separator: {
    height: 12,
  },
  card: {
    backgroundColor: '#1F2937', // var(--color-surface-2)
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#374151',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  eventName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '500',
  },
  progressContainer: {
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  progressValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#D4A017', // Gold progress indicator
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#D4A017', // Gold fill
    borderRadius: 2,
  },
  chevron: {
    marginLeft: 12,
  },
  empty: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 64,
  },
})
