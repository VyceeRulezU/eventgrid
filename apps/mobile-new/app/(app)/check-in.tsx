import { useState } from 'react'
import { View, FlatList, Text, TextInput, StyleSheet, RefreshControl } from 'react-native'
import { useAuthStore } from '@naligrid/shared'
import { useGuestCheckIn } from '../../hooks/useGuestCheckIn'
import { GuestRow } from '../../components/check-in/GuestRow'
import { colors, spacing, fontSize, fontWeight, radius } from '../../constants/tokens'

export default function CheckInScreen() {
  const { user } = useAuthStore()
  const [eventId, setEventId] = useState('')
  const { guests, search, setSearch, checkedInCount, totalCount, isLoading, refresh, checkIn } = useGuestCheckIn(eventId)

  if (!eventId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Guest Check-In</Text>
          <Text style={styles.subtitle}>Enter an event ID to start</Text>
        </View>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={eventId}
            onChangeText={setEventId}
            placeholder="Paste event ID..."
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Check-In</Text>
        <Text style={styles.subtitle}>{checkedInCount} / {totalCount} arrived</Text>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Search by name or phone..."
        placeholderTextColor={colors.textMuted}
      />

      <FlatList
        data={guests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GuestRow item={item} onCheckIn={() => checkIn(item.id)} />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  inputContainer: {
    padding: spacing[4],
  },
  input: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    fontSize: fontSize.base,
  },
  search: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[3],
    fontSize: fontSize.sm,
    margin: spacing[4],
    marginBottom: 0,
  },
  list: {
    padding: spacing[4],
  },
  separator: {
    height: spacing[2],
  },
})
