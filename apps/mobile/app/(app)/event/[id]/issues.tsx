import { useState } from 'react'
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useIssues } from '../../../../hooks/useIssues'
import { IssueCard } from '../../../../components/board/IssueCard'
import { colors, spacing, fontSize, fontWeight } from '../../../../constants/tokens'

export default function IssuesScreen() {
  const { id: eventId } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { openIssues, resolvedIssues, resolveIssue } = useIssues(eventId!)
  const [showResolved, setShowResolved] = useState(false)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Live Board</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Issues ({openIssues.length})</Text>
        <View style={{ width: 80 }} />
      </View>

      <FlatList
        data={openIssues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <IssueCard
            item={item}
            onResolve={() => resolveIssue(item.id, '', 'current_user')}
          />
        )}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          resolvedIssues.length > 0 ? (
            <>
              <TouchableOpacity
                style={styles.toggle}
                onPress={() => setShowResolved(!showResolved)}
              >
                <Text style={styles.toggleText}>
                  {showResolved ? 'Hide' : 'Show'} Resolved ({resolvedIssues.length})
                </Text>
              </TouchableOpacity>
              {showResolved ? (
                <>
                  {resolvedIssues.map(item => (
                    <View key={item.id} style={{ marginTop: spacing[2] }}>
                      <IssueCard item={item} />
                    </View>
                  ))}
                </>
              ) : null}
            </>
          ) : null
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[12],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
  },
  list: {
    padding: spacing[4],
  },
  separator: {
    height: spacing[2],
  },
  toggle: {
    paddingVertical: spacing[4],
    alignItems: 'center',
  },
  toggleText: {
    color: colors.accent,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
})
