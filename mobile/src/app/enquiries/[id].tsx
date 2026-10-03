import { Ionicons } from '@expo/vector-icons'
import { Stack, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'

import { useEnquiry, useLookups, useMarkContacted, useUpdateEnquiry } from '@/api/hooks'
import type { EnquiryDetail, EnquiryStatus } from '@/api/types'
import { ContactButtons } from '@/components/rows'
import { Badge, Button, Card, Chip, ErrorView, Field, LoadingView, SectionTitle } from '@/components/ui'
import { enquiryStatusMeta, enquiryTypeLabels, formatDate, formatDateTime } from '@/lib/format'
import { colors, spacing } from '@/lib/theme'

const fallbackStatuses: EnquiryStatus[] = ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'LOST']

export default function EnquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const enquiryId = Number(id)
  const { data: enquiry, error, isLoading, refetch } = useEnquiry(enquiryId)

  if (isLoading) return <LoadingView />
  if (error || !enquiry) return <ErrorView message={error?.message ?? 'Enquiry not found.'} onRetry={refetch} />

  return <EnquiryDetailView enquiry={enquiry} />
}

function EnquiryDetailView({ enquiry }: { enquiry: EnquiryDetail }) {
  const { data: lookups } = useLookups()
  const update = useUpdateEnquiry(enquiry.id)
  const markContacted = useMarkContacted('enquiries')
  const [notes, setNotes] = useState(enquiry.notes ?? '')

  useEffect(() => setNotes(enquiry.notes ?? ''), [enquiry.notes])

  const status = enquiryStatusMeta[enquiry.status]
  const notesChanged = notes !== (enquiry.notes ?? '')

  const setStatus = (next: EnquiryStatus) => {
    if (next === enquiry.status) return
    update.mutate({ status: next }, { onError: (err) => Alert.alert('Could not update', err.message) })
  }

  const saveNotes = () =>
    update.mutate(
      { notes: notes.trim() || null },
      { onError: (err) => Alert.alert('Could not save notes', err.message) },
    )

  const details: [string, string | null | undefined][] = [
    ['Type', enquiryTypeLabels[enquiry.type]],
    ['Package', enquiry.package?.title],
    ['Destination', enquiry.destination?.name],
    ['Travel date', enquiry.travelDate && formatDate(enquiry.travelDate)],
    ['Travellers', enquiry.pax ? String(enquiry.pax) : null],
    ['School', enquiry.schoolName],
    ['Pickup', enquiry.pickupLocation],
    ['Children', enquiry.numberOfChildren ? String(enquiry.numberOfChildren) : null],
    ['Start date', enquiry.startDate && formatDate(enquiry.startDate)],
    ['Email', enquiry.email],
    ['Source', enquiry.source],
    ['Received', formatDateTime(enquiry.createdAt)],
  ]

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <Stack.Screen options={{ title: enquiry.name }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Card style={styles.contactCard}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.name}>{enquiry.name}</Text>
            <Text style={styles.phone}>{enquiry.phone}</Text>
            <Badge bg={status.bg} fg={status.fg} label={status.label} />
            {enquiry.contactedAt ? (
              <Text style={styles.called}>Called {formatDateTime(enquiry.contactedAt)}</Text>
            ) : null}
          </View>
          <ContactButtons
            onCall={() => {
              if (!enquiry.contactedAt) markContacted.mutate(enquiry.id)
            }}
            phone={enquiry.phone}
          />
        </Card>

        <SectionTitle title="Status" />
        <View style={styles.chips}>
          {(lookups?.enquiryStatuses ?? fallbackStatuses).map((value) => (
            <Chip
              key={value}
              label={enquiryStatusMeta[value].label}
              onPress={() => setStatus(value)}
              selected={enquiry.status === value}
            />
          ))}
        </View>

        <SectionTitle title="Details" />
        <Card style={{ gap: spacing.md }}>
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <View key={label} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
              </View>
            ))}
        </Card>

        {enquiry.message ? (
          <>
            <SectionTitle title="Message" />
            <Card>
              <Text style={styles.message}>{enquiry.message}</Text>
            </Card>
          </>
        ) : null}

        <SectionTitle title="Internal notes" />
        <Field
          label="Only visible to admins"
          multiline
          onChangeText={setNotes}
          placeholder="Quoted ₹12,000 for 4 pax, follow up Monday…"
          value={notes}
        />
        <Button
          disabled={!notesChanged}
          icon="save-outline"
          loading={update.isPending && notesChanged}
          onPress={saveNotes}
          style={{ marginTop: spacing.md }}
          title="Save notes"
          variant="secondary"
        />

        {enquiry.assignedTo ? (
          <View style={styles.assigned}>
            <Ionicons color={colors.textMuted} name="person-circle-outline" size={16} />
            <Text style={styles.assignedText}>Assigned to {enquiry.assignedTo.name ?? enquiry.assignedTo.email}</Text>
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  contactCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 20, fontWeight: '700', color: colors.text },
  phone: { fontSize: 15, color: colors.navy700, marginBottom: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailRow: { flexDirection: 'row', gap: spacing.md },
  detailLabel: { width: 96, fontSize: 14, color: colors.textMuted },
  detailValue: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  message: { fontSize: 15, lineHeight: 22, color: colors.text },
  called: { fontSize: 12, color: colors.success, marginTop: 4 },
  assigned: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  assignedText: { fontSize: 13, color: colors.textMuted },
})
