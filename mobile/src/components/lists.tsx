import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, StyleSheet, View } from 'react-native'

import { flattenPages, useBookings, useEnquiries } from '@/api/hooks'
import type { EnquiryStatus } from '@/api/types'
import { enquiryStatusMeta } from '@/lib/format'
import { colors, spacing } from '@/lib/theme'

import { BookingRow, CallbackRow, EnquiryRow } from './rows'
import { Chip, EmptyState, ErrorView, LoadingView } from './ui'

// The three request lists shown inside the Requests tab.

export function CallbacksList() {
  const query = useBookings('callback')
  const items = flattenPages(query.data)

  if (query.isLoading) return <LoadingView />
  if (query.error) return <ErrorView message={query.error.message} onRetry={query.refetch} />

  return (
    <FlatList
      ListEmptyComponent={
        <EmptyState
          icon="call-outline"
          message="People who use “Prefer a call back?” on your website will appear here."
          title="No call-back requests yet"
        />
      }
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold600} /> : null}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching && !query.isFetchingNextPage} tintColor={colors.gold600} />
      }
      renderItem={({ item }) => <CallbackRow callback={item} />}
    />
  )
}

export function BookingsList() {
  const query = useBookings('booking')
  const items = flattenPages(query.data)

  if (query.isLoading) return <LoadingView />
  if (query.error) return <ErrorView message={query.error.message} onRetry={query.refetch} />

  return (
    <FlatList
      ListEmptyComponent={
        <EmptyState
          icon="car-outline"
          message="Submissions from the “Book Your Ride” form on your website will appear here."
          title="No bookings yet"
        />
      }
      ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold600} /> : null}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching && !query.isFetchingNextPage} tintColor={colors.gold600} />
      }
      renderItem={({ item }) => <BookingRow booking={item} />}
    />
  )
}

const enquiryFilters: (EnquiryStatus | undefined)[] = [undefined, 'NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'LOST']

export function EnquiriesList() {
  const [status, setStatus] = useState<EnquiryStatus | undefined>()
  const query = useEnquiries(status)
  const items = flattenPages(query.data)

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipBar}
      >
        {enquiryFilters.map((value) => (
          <Chip
            key={value ?? 'ALL'}
            label={value ? enquiryStatusMeta[value].label : 'All'}
            onPress={() => setStatus(value)}
            selected={status === value}
          />
        ))}
      </ScrollView>

      {query.isLoading ? (
        <LoadingView />
      ) : query.error ? (
        <ErrorView message={query.error.message} onRetry={query.refetch} />
      ) : (
        <FlatList
          ListEmptyComponent={
            <EmptyState
              icon="chatbubbles-outline"
              message="Enquiries from the package pages on your website will appear here."
              title={status ? `No ${enquiryStatusMeta[status].label.toLowerCase()} enquiries` : 'No enquiries yet'}
            />
          }
          ListFooterComponent={query.isFetchingNextPage ? <ActivityIndicator color={colors.gold600} /> : null}
          contentContainerStyle={[styles.list, { paddingTop: 0 }]}
          data={items}
          keyExtractor={(item) => String(item.id)}
          onEndReached={() => query.hasNextPage && !query.isFetchingNextPage && query.fetchNextPage()}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl onRefresh={query.refetch} refreshing={query.isRefetching && !query.isFetchingNextPage} tintColor={colors.gold600} />
          }
          renderItem={({ item }) => <EnquiryRow enquiry={item} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  chipBar: { flexGrow: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
})
