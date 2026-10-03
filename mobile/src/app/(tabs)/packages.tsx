import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, router } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native'

import { useDeletePackage, usePackages, useTogglePublished } from '@/api/hooks'
import type { PackageSummary } from '@/api/types'
import { EmptyState, ErrorView, LoadingView } from '@/components/ui'
import { formatDuration, formatPrice } from '@/lib/format'
import { colors, radius, shadow, spacing } from '@/lib/theme'

type Filter = 'all' | 'published' | 'draft' | 'featured'

// Gradient for packages without a cover photo, picked from the destination
// name so the same place always gets the same colours.
const FALLBACKS: [string, string][] = [
  ['#1E7A5F', '#0F2544'],
  ['#2C5F3F', '#0A1A30'],
  ['#B9862A', '#0F2544'],
  ['#274469', '#081426'],
]
function fallbackGradient(key: string): [string, string] {
  let hash = 0
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0
  return FALLBACKS[Math.abs(hash) % FALLBACKS.length]!
}

export default function PackagesScreen() {
  const { data, error, isLoading, isRefetching, refetch } = usePackages()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')

  const all = data ?? []
  const counts: Record<Filter, number> = {
    all: all.length,
    published: all.filter((p) => p.published).length,
    draft: all.filter((p) => !p.published).length,
    featured: all.filter((p) => p.featured).length,
  }

  const packages = useMemo(() => {
    const q = query.trim().toLowerCase()
    return all.filter((pkg) => {
      if (filter === 'published' && !pkg.published) return false
      if (filter === 'draft' && pkg.published) return false
      if (filter === 'featured' && !pkg.featured) return false
      if (!q) return true
      return pkg.title.toLowerCase().includes(q) || pkg.destination.name.toLowerCase().includes(q)
    })
  }, [all, filter, query])

  if (isLoading) return <LoadingView />
  if (error) return <ErrorView message={error.message} onRetry={refetch} />

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ListEmptyComponent={
          <EmptyState
            icon="map-outline"
            message={all.length ? 'Try a different search or filter.' : 'Tap “New package” to create your first tour.'}
            title={all.length ? 'No matches' : 'No packages yet'}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.summaryRow}>
              <SummaryPill icon="map" label="Total" value={counts.all} />
              <SummaryPill icon="eye" label="Live" tint={colors.success} value={counts.published} />
              <SummaryPill icon="create" label="Drafts" tint={colors.warning} value={counts.draft} />
            </View>

            <View style={styles.search}>
              <Ionicons color={colors.textMuted} name="search" size={18} />
              <TextInput
                autoCorrect={false}
                onChangeText={setQuery}
                placeholder="Search by name or destination"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                value={query}
              />
              {query ? (
                <Pressable accessibilityLabel="Clear search" hitSlop={8} onPress={() => setQuery('')}>
                  <Ionicons color={colors.textMuted} name="close-circle" size={18} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.filters}>
              {(['all', 'published', 'draft', 'featured'] as const).map((value) => {
                const active = filter === value
                return (
                  <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, active && styles.filterActive]}>
                    <Text style={[styles.filterText, active && styles.filterTextActive]}>
                      {value === 'all' ? 'All' : value === 'published' ? 'Live' : value === 'draft' ? 'Drafts' : '★ Featured'}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        }
        contentContainerStyle={styles.list}
        data={packages}
        keyExtractor={(pkg) => String(pkg.id)}
        refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} tintColor={colors.gold600} />}
        renderItem={({ item }) => <PackageCard pkg={item} />}
      />

      <Pressable
        accessibilityLabel="New package"
        onPress={() => router.push('/packages/new')}
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] }]}
      >
        <Ionicons color={colors.navy950} name="add" size={22} />
        <Text style={styles.fabText}>New package</Text>
      </Pressable>
    </View>
  )
}

function SummaryPill({ icon, label, value, tint = colors.navy700 }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: number; tint?: string }) {
  return (
    <View style={styles.summary}>
      <Ionicons color={tint} name={icon} size={16} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  )
}

function PackageCard({ pkg }: { pkg: PackageSummary }) {
  const toggle = useTogglePublished()
  const remove = useDeletePackage()
  const days = pkg._count?.itineraryDays ?? 0

  const confirmDelete = () =>
    Alert.alert(`Delete “${pkg.title}”?`, 'This removes it from the website. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => remove.mutate(pkg.id, { onError: (err) => Alert.alert('Could not delete', err.message) }),
      },
    ])

  return (
    <View style={[styles.card, remove.isPending && { opacity: 0.4 }]}>
      <Link asChild href={{ pathname: '/packages/[id]', params: { id: String(pkg.id) } }}>
        <Pressable onLongPress={confirmDelete}>
          <View style={styles.cover}>
            {pkg.imageUrl ? (
              <Image contentFit="cover" source={{ uri: pkg.imageUrl }} style={StyleSheet.absoluteFill} transition={200} />
            ) : (
              <LinearGradient
                colors={fallbackGradient(pkg.destination.name)}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={[StyleSheet.absoluteFill, styles.coverFallback]}
              >
                <Ionicons color="rgba(240,200,104,0.55)" name="image-outline" size={34} />
              </LinearGradient>
            )}
            <LinearGradient colors={['rgba(8,20,38,0)', 'rgba(8,20,38,0.85)']} style={StyleSheet.absoluteFill} />

            <View style={styles.coverTop}>
              <View style={[styles.status, { backgroundColor: pkg.published ? colors.success : 'rgba(8,20,38,0.7)' }]}>
                <View style={[styles.statusDot, { backgroundColor: pkg.published ? '#a6f4c5' : colors.gold300 }]} />
                <Text style={styles.statusText}>{pkg.published ? 'Live' : 'Draft'}</Text>
              </View>
              {pkg.featured ? (
                <View style={styles.featured}>
                  <Ionicons color={colors.navy950} name="star" size={11} />
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.coverBottom}>
              <View style={styles.destination}>
                <Ionicons color={colors.gold300} name="location" size={13} />
                <Text style={styles.destinationText}>{pkg.destination.name}</Text>
              </View>
              <Text numberOfLines={2} style={styles.title}>
                {pkg.title}
              </Text>
            </View>
          </View>
        </Pressable>
      </Link>

      <View style={styles.body}>
        <View style={styles.metaRow}>
          <Meta icon="calendar-outline" text={formatDuration(pkg.durationDays, pkg.durationNights) || '—'} />
          <Meta icon="list-outline" text={days ? `${days}-day plan` : 'No itinerary'} warn={!days} />
          <Text style={styles.price}>{formatPrice(pkg.priceFrom, pkg.priceUnit)}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.liveToggle}>
            <Switch
              accessibilityLabel={pkg.published ? 'Unpublish package' : 'Publish package'}
              onValueChange={(published) =>
                toggle.mutate({ id: pkg.id, published }, { onError: (err) => Alert.alert('Could not update', err.message) })
              }
              thumbColor={pkg.published ? colors.gold500 : '#f4f3f4'}
              trackColor={{ false: colors.border, true: colors.navy700 }}
              value={pkg.published}
            />
            <Text style={styles.liveLabel}>{pkg.published ? 'On website' : 'Hidden'}</Text>
          </View>
          <View style={styles.cardActions}>
            <Pressable
              accessibilityLabel="Edit package"
              hitSlop={6}
              onPress={() => router.push({ pathname: '/packages/[id]', params: { id: String(pkg.id) } })}
              style={styles.iconButton}
            >
              <Ionicons color={colors.navy800} name="create-outline" size={19} />
            </Pressable>
            <Pressable accessibilityLabel="Delete package" hitSlop={6} onPress={confirmDelete} style={[styles.iconButton, { backgroundColor: colors.dangerSoft }]}>
              <Ionicons color={colors.danger} name="trash-outline" size={19} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
}

function Meta({ icon, text, warn }: { icon: keyof typeof Ionicons.glyphMap; text: string; warn?: boolean }) {
  return (
    <View style={styles.meta}>
      <Ionicons color={warn ? colors.warning : colors.textMuted} name={icon} size={14} />
      <Text style={[styles.metaText, warn && { color: colors.warning }]}>{text}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, paddingBottom: 110, gap: spacing.lg, flexGrow: 1 },
  header: { gap: spacing.md },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  summaryValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  summaryLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  searchInput: { flex: 1, minHeight: 46, fontSize: 15, color: colors.text },
  filters: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs },
  filter: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.ivoryDim,
  },
  filterActive: { backgroundColor: colors.navy900 },
  filterText: { fontSize: 13, fontWeight: '600', color: colors.navy700 },
  filterTextActive: { color: colors.ivory },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 3,
  },
  cover: { height: 190, justifyContent: 'space-between' },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  coverTop: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '700', color: colors.ivory },
  featured: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold500,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  featuredText: { fontSize: 12, fontWeight: '800', color: colors.navy950 },
  coverBottom: { padding: spacing.lg, gap: 4 },
  destination: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  destinationText: { fontSize: 13, fontWeight: '700', color: colors.gold300 },
  title: { fontSize: 20, fontWeight: '800', color: colors.ivory },

  body: { padding: spacing.lg, gap: spacing.md },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },
  price: { marginLeft: 'auto', fontSize: 15, fontWeight: '800', color: colors.gold600 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  liveToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  liveLabel: { fontSize: 13, fontWeight: '600', color: colors.navy700 },
  cardActions: { flexDirection: 'row', gap: spacing.sm },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.ivoryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gold500,
    ...shadow,
    shadowOpacity: 0.25,
    elevation: 6,
  },
  fabText: { fontSize: 15, fontWeight: '800', color: colors.navy950 },
})
