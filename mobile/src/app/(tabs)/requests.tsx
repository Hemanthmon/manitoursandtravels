import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { useDashboard } from '@/api/hooks'
import { BookingsList, CallbacksList, EnquiriesList } from '@/components/lists'
import { colors, radius, spacing } from '@/lib/theme'

// Everything customers send from the website, in one tab:
// call-back requests, ride bookings and package enquiries.

export type RequestsView = 'callbacks' | 'bookings' | 'enquiries'
const VIEWS: { key: RequestsView; label: string }[] = [
  { key: 'callbacks', label: 'Call-backs' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'enquiries', label: 'Enquiries' },
]

export default function RequestsScreen() {
  const params = useLocalSearchParams<{ view?: string }>()
  const view: RequestsView = VIEWS.some((v) => v.key === params.view) ? (params.view as RequestsView) : 'callbacks'
  const { data } = useDashboard()

  // Number shown on each segment: things that still need you.
  const counts: Record<RequestsView, number> = {
    callbacks: data?.pendingCallbackCount ?? 0,
    bookings: data?.bookingsToday ?? 0,
    enquiries: data?.newEnquiryCount ?? 0,
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.segmentWrap}>
        <View style={styles.segment}>
          {VIEWS.map(({ key, label }) => {
            const active = key === view
            return (
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                key={key}
                onPress={() => router.setParams({ view: key })}
                style={[styles.segmentItem, active && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                {counts[key] > 0 ? (
                  <View style={[styles.count, active && { backgroundColor: colors.gold500 }]}>
                    <Text style={styles.countText}>{counts[key]}</Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })}
        </View>
        <Text style={styles.caption}>
          {view === 'callbacks'
            ? `${counts.callbacks} waiting for a call`
            : view === 'bookings'
              ? `${counts.bookings} new today`
              : `${counts.enquiries} new enquiries`}
        </Text>
      </View>

      {view === 'callbacks' ? <CallbacksList /> : view === 'bookings' ? <BookingsList /> : <EnquiriesList />}
    </View>
  )
}

const styles = StyleSheet.create({
  segmentWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.ivoryDim,
    borderRadius: radius.md,
    padding: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm,
  },
  segmentItemActive: { backgroundColor: colors.navy900 },
  segmentText: { fontSize: 14, fontWeight: '600', color: colors.navy700 },
  segmentTextActive: { color: colors.ivory },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold300,
  },
  countText: { fontSize: 11, fontWeight: '800', color: colors.navy950 },
  caption: { fontSize: 13, color: colors.textMuted },
})
