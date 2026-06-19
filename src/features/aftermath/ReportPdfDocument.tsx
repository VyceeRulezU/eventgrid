import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportData, VendorRating, AiNarrative } from './EventReportBuilder'

function buildFallbackNarrative(data: ReportData, type: 'internal' | 'client', plannerName?: string): AiNarrative {
  const eventName = data.event?.name || 'this event'
  const eventType = data.event?.event_type || 'event'
  const planner = plannerName || 'the planning team'
  const guestCount = data.guestCount
  const checkedIn = data.checkedIn
  const vendorCount = data.vendorCount
  const totalIssues = data.issues.length
  const resolvedIssues = data.issuesResolved
  const completedPhases = data.phases.filter((p) => p.status === 'completed').length
  const totalPhases = data.phases.length || 9

  return {
    executiveSummary:
      type === 'internal'
        ? `${eventName} was a ${eventType} coordinated by ${planner}. The event had ${guestCount} invited guests with ${checkedIn} checking in. ${vendorCount} vendors supported the event. ${completedPhases} of ${totalPhases} planning phases were completed. ${totalIssues > 0 ? `${resolvedIssues} of ${totalIssues} issues were resolved` : 'No major issues were reported'} during the event lifecycle.`
        : `${eventName} was a wonderful ${eventType} with ${guestCount} guests in attendance. The event was supported by ${vendorCount} professional vendors. We hope you enjoyed the experience.`,
    highlights:
      type === 'internal'
        ? [
            `${vendorCount} vendors collaborated to deliver a seamless ${eventType}.`,
            `${checkedIn} of ${guestCount} guests checked in successfully.`,
            `${completedPhases} of ${totalPhases} planning phases were completed.`,
            `${data.mediaCount} media files captured during the event.`,
            totalIssues > 0
              ? `${resolvedIssues} issues were resolved during the event lifecycle.`
              : 'All issues were proactively managed.',
          ]
        : [
            `A beautiful ${eventType} held with ${guestCount} guests attending.`,
            `${vendorCount} vendors contributed to making the event memorable.`,
            `${data.mediaCount} photos and media moments captured.`,
            `The team ensured every detail was taken care of.`,
          ],
    vendorNotes:
      type === 'internal'
        ? `${vendorCount} vendors were assigned to ${eventName}. Each contributed to the successful delivery of this ${eventType}. Review individual ratings in the vendors section for detailed performance feedback.`
        : '',
    issueSummary:
      totalIssues > 0
        ? `${totalIssues} ${totalIssues === 1 ? 'issue was' : 'issues were'} logged during ${eventName}. ${resolvedIssues} of ${totalIssues} ${totalIssues === 1 ? 'was' : 'were'} resolved. Lessons learned have been documented for future reference.`
        : `No significant issues were recorded during ${eventName}. The event ran smoothly from start to finish.`,
    recommendations: [
      `Continue documenting vendor performance to build a reliable vendor network for future events.`,
      `Review guest check-in data to optimise the arrival experience for larger events.`,
      `Apply lessons learned from completed phases to improve execution in future events.`,
    ],
  }
}

const COLORS = {
  gold: '#D4A017',
  dark: '#111827',
  body: '#374151',
  muted: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  green: '#22c55e',
  grey: '#d1d5db',
}

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: COLORS.body,
    backgroundColor: COLORS.white,
  },
  goldBar: {
    height: 5,
    backgroundColor: COLORS.gold,
  },
  header: {
    padding: '32px 40px 20px',
    borderBottom: `1 solid ${COLORS.border}`,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: COLORS.gold,
  },
  reportBadge: {
    backgroundColor: COLORS.gold,
    padding: '4px 12px',
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.dark,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginTop: 16,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    fontSize: 9,
    color: COLORS.muted,
  },
  metaValue: {
    color: COLORS.body,
    fontWeight: 'bold',
  },
  body: {
    padding: '24px 40px 40px',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 6,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    backgroundColor: COLORS.gold,
    marginRight: 8,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.dark,
    letterSpacing: -0.2,
    textTransform: 'uppercase' as const,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    padding: '10px 14px',
    border: `1 solid ${COLORS.border}`,
    borderRadius: 6,
  },
  kpiLabel: {
    fontSize: 8,
    color: COLORS.muted,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  rowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  label: {
    color: COLORS.muted,
    fontSize: 10,
  },
  value: {
    fontWeight: 'bold',
    color: COLORS.dark,
    fontSize: 10,
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  phaseText: {
    fontSize: 10,
    color: COLORS.body,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  ratingLabel: {
    fontSize: 10,
    color: COLORS.body,
    flex: 1,
  },
  ratingStar: {
    color: COLORS.gold,
    fontSize: 11,
  },
  issueRow: {
    marginBottom: 6,
    padding: 8,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 4,
  },
  issueTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 2,
  },
  issueLesson: {
    fontSize: 9,
    color: COLORS.muted,
  },
  summaryBox: {
    padding: 10,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 10,
    color: COLORS.body,
    lineHeight: 1.5,
  },
  highlightItem: {
    flexDirection: 'row',
    paddingVertical: 2,
  },
  highlightBullet: {
    fontSize: 10,
    color: COLORS.gold,
    marginRight: 6,
    width: 10,
  },
  highlightText: {
    fontSize: 10,
    color: COLORS.body,
    flex: 1,
  },
  recBox: {
    padding: 8,
    border: `1 solid ${COLORS.border}`,
    borderRadius: 4,
    marginBottom: 4,
    backgroundColor: '#FAFAFA',
  },
  recText: {
    fontSize: 10,
    color: COLORS.body,
    lineHeight: 1.4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 40,
    right: 40,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },
})

interface PdfDocProps {
  data: ReportData
  vendorRatings: VendorRating[]
  type: 'internal' | 'client'
  plannerName?: string
}

export function ReportPdfDocument({ data, vendorRatings, type, plannerName }: PdfDocProps) {
  const narrative = data.aiNarrative || buildFallbackNarrative(data, type, plannerName)
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.goldBar} />

        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.brand}>
              NaliGrid
            </Text>
            <Text style={styles.reportBadge}>
              {type === 'internal' ? 'Internal Report' : 'Client Report'}
            </Text>
          </View>
          <Text style={styles.eventTitle}>{data.event?.name || 'Event Report'}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>
              Date: <Text style={styles.metaValue}>
                {data.event?.event_date
                  ? new Date(data.event.event_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </Text>
            </Text>
            {plannerName && (
              <Text style={styles.metaItem}>
                Prepared by: <Text style={styles.metaValue}>{plannerName}</Text>
              </Text>
            )}
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Guests Invited</Text>
              <Text style={styles.kpiValue}>{data.guestCount}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Checked In</Text>
              <Text style={styles.kpiValue}>{data.checkedIn}</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>Vendors</Text>
              <Text style={styles.kpiValue}>{data.vendorCount}</Text>
            </View>
            {type === 'internal' && (
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>Budget</Text>
                <Text style={styles.kpiValue}>
                  {(data.totalBudget / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Executive Summary</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryText}>{narrative.executiveSummary}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Highlights</Text>
            </View>
            {narrative.highlights.map((h, i) => (
              <View key={i} style={styles.highlightItem}>
                <Text style={styles.highlightBullet}>✦</Text>
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>

          {type === 'internal' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionAccent} />
                <Text style={styles.sectionTitle}>Financial Summary</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Total Budget</Text>
                <Text style={styles.value}>
                  {(data.totalBudget / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                </Text>
              </View>
              <View style={styles.rowLast}>
                <Text style={styles.label}>Total Expenses</Text>
                <Text style={styles.value}>
                  {(data.totalExpense / 100).toLocaleString('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 })}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Vendors ({data.vendorCount})</Text>
            </View>
            {vendorRatings.length === 0 ? (
              <Text style={{ color: COLORS.muted, fontSize: 10 }}>No vendors assigned.</Text>
            ) : (
              vendorRatings.map((vr) => (
                <View key={vr.id} style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>{vr.name} — {vr.category}</Text>
                  <Text style={styles.ratingStar}>
                    {'★'.repeat(vr.rating)}{'☆'.repeat(5 - vr.rating)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Issues</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Issues</Text>
              <Text style={styles.value}>{data.issues.length}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Resolved</Text>
              <Text style={styles.value}>{data.issuesResolved}</Text>
            </View>
            {data.issues.filter((i) => i.lessons_learned).map((i) => (
              <View key={i.id} style={styles.issueRow}>
                <Text style={styles.issueTitle}>{i.title}</Text>
                <Text style={styles.issueLesson}>Lesson: {i.lessons_learned}</Text>
              </View>
            ))}
            <View style={{ marginTop: 8 }}>
              <Text style={styles.summaryText}>{narrative.issueSummary}</Text>
            </View>
            {type === 'internal' && (
              <View style={{ marginTop: 8 }}>
                <View style={styles.summaryBox}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.muted, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Vendor Notes</Text>
                  <Text style={styles.summaryText}>{narrative.vendorNotes}</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Phase Progress</Text>
            </View>
            {data.phases.map((p) => (
              <View key={p.id} style={styles.phaseItem}>
                <View style={[styles.phaseDot, { backgroundColor: p.status === 'completed' ? COLORS.green : COLORS.grey }]} />
                <Text style={styles.phaseText}>
                  Phase {p.phase_number}: {p.phase_name}
                  {p.status === 'completed' ? ' — Completed' : ''}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Recommendations</Text>
            </View>
            {narrative.recommendations.map((r, i) => (
              <View key={i} style={styles.recBox}>
                <Text style={styles.recText}>
                  <Text style={{ fontWeight: 'bold' }}>{i + 1}. </Text>
                  {r}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionTitle}>Media</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Total Media Files</Text>
              <Text style={styles.value}>{data.mediaCount}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Shared with Client</Text>
              <Text style={styles.value}>{data.clientSharedCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Generated by NaliGrid</Text>
          <Text>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
      </Page>
    </Document>
  )
}
