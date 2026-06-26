import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '../../../../../lib/supabase'
import { Button } from '../../../../../components/ui/Button'
import { StatusDot } from '../../../../../components/ui/StatusDot'
import { colors, spacing, fontSize, fontWeight, radius } from '../../../../../constants/tokens'
import type { StatusLevel } from '@naligrid/shared'

const statusOptions: { label: string; value: StatusLevel }[] = [
  { label: 'Ready', value: 'green' },
  { label: 'In Progress', value: 'yellow' },
  { label: 'Delayed', value: 'red' },
  { label: 'Not Started', value: 'grey' },
]

const severityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Critical', value: 'critical' },
]

export default function StationDetailScreen() {
  const { id: eventId, stationId } = useLocalSearchParams<{ id: string; stationId: string }>()
  const router = useRouter()

  const [status, setStatus] = useState<string>('grey')
  const [note, setNote] = useState('')
  const [issueTitle, setIssueTitle] = useState('')
  const [issueDesc, setIssueDesc] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [showIssueForm, setShowIssueForm] = useState(false)

  const handleUpdateStatus = async () => {
    await supabase.from('live_board_items').update({ status, status_label: note || null }).eq('id', stationId)
    router.back()
  }

  const handleFlagIssue = async () => {
    if (!issueTitle.trim()) return
    await supabase.from('issues').insert({
      event_id: eventId!,
      board_item_id: stationId,
      title: issueTitle,
      description: issueDesc || null,
      severity,
      raised_by: 'current_user_id',
    })
    router.back()
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Update Status</Text>
      <View style={styles.statusRow}>
        {statusOptions.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, status === opt.value && styles.chipSelected]}
            onPress={() => setStatus(opt.value)}
          >
            <StatusDot status={opt.value} size={8} />
            <Text style={[styles.chipText, status === opt.value && styles.chipTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="Status note..."
        placeholderTextColor={colors.textMuted}
      />

      <Button title="Update Status" onPress={handleUpdateStatus} />

      <View style={styles.divider} />

      <TouchableOpacity onPress={() => setShowIssueForm(!showIssueForm)}>
        <Text style={styles.flagLink}>{showIssueForm ? 'Cancel' : 'Flag Issue'}</Text>
      </TouchableOpacity>

      {showIssueForm ? (
        <View style={styles.issueForm}>
          <TextInput
            style={styles.input}
            value={issueTitle}
            onChangeText={setIssueTitle}
            placeholder="Issue title *"
            placeholderTextColor={colors.textMuted}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={issueDesc}
            onChangeText={setIssueDesc}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            multiline
          />

          <Text style={styles.label}>Severity</Text>
          <View style={styles.statusRow}>
            {severityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, severity === opt.value && styles.chipSelected]}
                onPress={() => setSeverity(opt.value)}
              >
                <Text style={[styles.chipText, severity === opt.value && styles.chipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Button title="Submit Issue" onPress={handleFlagIssue} />
        </View>
      ) : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgBase,
    padding: spacing[4],
    paddingTop: spacing[12],
  },
  header: {
    marginBottom: spacing[6],
  },
  backText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    marginBottom: spacing[4],
  },
  statusRow: {
    flexDirection: 'row',
    gap: spacing[2],
    flexWrap: 'wrap',
    marginBottom: spacing[4],
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.surface3,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentMuted,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  chipTextSelected: {
    color: colors.accent,
  },
  input: {
    backgroundColor: colors.surface2,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[4],
    fontSize: fontSize.base,
    marginBottom: spacing[4],
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing[6],
  },
  flagLink: {
    color: colors.statusRed,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing[4],
  },
  issueForm: {
    marginTop: spacing[2],
  },
  label: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    marginBottom: spacing[2],
  },
})
