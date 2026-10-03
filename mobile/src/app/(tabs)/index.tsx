import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, type Href } from 'expo-router'
import { Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { SITE_URL } from '@/api/client'
import { useDashboard } from '@/api/hooks'
import type { Booking, DashboardStats, EnquirySummary } from '@/api/types'
import { useAuth } from '@/auth/AuthProvider'
import { ErrorView, LoadingView } from '@/components/ui'
import { enquiryStatusMeta, initials, timeAgo } from '@/lib/format'
import { colors, radius, shadow, spacing } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { data, error, isLoading, isRefetching, refetch } = useDashboard()

  if (isLoading) return <LoadingView />
  if (error || !data) return <ErrorView message={error?.message ?? 'Could not load the dashboard.'} onRetry={refetch} />

  const firstName = user?.name?.split(' ')[0] || 'there'
  const needsAttention = data.pendingCallbackCount + data.newEnquiryCount
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <ScrollView
      contentContainerStyle={{ paddingBottom: spacing.xxl }}
      refreshControl={<RefreshControl onRefresh={refetch} refreshing={isRefetching} tintColor={colors.gold300} />}
      style={{ backgroundColor: colors.background }}
    >
      {/* ---------- Hero ---------- */}
      <LinearGradient
        colors={[colors.navy700, colors.navy900, colors.navy950]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.date}>{today}</Text>
            <Text style={styles.greeting}>
              {greeting()}, {firstName}
            </Text>
          </View>
          <Pressable accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name, user?.email)}</Text>
          </Pressable>
        </View>

        <Text style={styles.heroLine}>
          {needsAttention > 0
            ? `${needsAttention} ${needsAttention === 1 ? 'customer is' : 'customers are'} waiting for you`
            : 'All caught up. Nice work!'}
        </Text>

        <View style={styles.attentionRow}>
          <AttentionTile
            count={data.pendingCallbackCount}
            href={{ pathname: '/requests', params: { view: 'callbacks' } }}
            icon="call"
            label="Call-backs waiting"
          />
          <AttentionTile
            count={data.newEnquiryCount}
            href={{ pathname: '/requests', params: { view: 'enquiries' } }}
            icon="chatbubbles"
            label="New enquiries"
          />
        </View>
      </LinearGradient>

      {/* ---------- Stats ---------- */}
      <View style={styles.statsGrid}>
        <StatCard icon="today" label="Bookings today" tint={colors.info} tintSoft={colors.infoSoft} value={data.bookingsToday} />
        <StatCard icon="car" label="All bookings" tint={colors.navy700} tintSoft={colors.ivoryDim} value={data.bookingCount} />
        <StatCard
          icon="map"
          label="Live packages"
          sub={`of ${data.packageCount}`}
          tint={colors.success}
          tintSoft={colors.successSoft}
          value={data.publishedCount}
        />
        <StatCard icon="mail-open" label="All enquiries" tint={colors.gold600} tintSoft={colors.warningSoft} value={data.enquiryCount} />
      </View>

      {/* ---------- Quick actions ---------- */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.actions}>
        <QuickAction icon="add-circle" label="New package" onPress={() => router.push('/packages/new')} primary />
        <QuickAction icon="file-tray-full" label="Requests" onPress={() => router.push('/requests')} />
        <QuickAction icon="globe-outline" label="Website" onPress={() => SITE_URL && Linking.openURL(SITE_URL)} />
      </View>

      {/* ---------- Activity ---------- */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginHorizontal: 0 }]}>Recent activity</Text>
        <Pressable hitSlop={8} onPress={() => router.push('/requests')}>
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      <ActivityFeed data={data} />
    </ScrollView>
  )
}

function AttentionTile({ count, label, icon, href }: { count: number; label: string; icon: IconName; href: Href }) {
  const hot = count > 0
  return (
    <Pressable onPress={() => router.push(href)} style={({ pressed }) => [styles.attention, hot && styles.attentionHot, pressed && { opacity: 0.85 }]}>
      <View style={[styles.attentionIcon, hot && { backgroundColor: colors.navy950 }]}>
        <Ionicons color={hot ? colors.gold300 : colors.ivory} name={icon} size={18} />
      </View>
      <Text style={[styles.attentionCount, hot && { color: colors.navy950 }]}>{count}</Text>
      <View style={styles.attentionFooter}>
        <Text style={[styles.attentionLabel, hot && { color: colors.navy900 }]}>{label}</Text>
        <Ionicons color={hot ? colors.navy900 : 'rgba(251,249,244,0.6)'} name="arrow-forward" size={14} />
      </View>
    </Pressable>
  )
}

function StatCard({
  icon,
  label,
  value,
  sub,
  tint,
  tintSoft,
}: {
  icon: IconName
  label: string
  value: number
  sub?: string
  tint: string
  tintSoft: string
}) {
  return (
    <View style={styles.stat}>
      <View style={[styles.statIcon, { backgroundColor: tintSoft }]}>
        <Ionicons color={tint} name={icon} size={18} />
      </View>
      <Text style={styles.statValue}>
        {value}
        {sub ? <Text style={styles.statSub}> {sub}</Text> : null}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function QuickAction({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, primary && styles.actionPrimary, pressed && { opacity: 0.85 }]}>
      <Ionicons color={primary ? colors.navy950 : colors.navy800} name={icon} size={24} />
      <Text style={[styles.actionLabel, primary && { color: colors.navy950 }]}>{label}</Text>
    </Pressable>
  )
}

// ---------- Activity feed: call-backs, bookings and enquiries, newest first ----------

type ActivityItem = {
  key: string
  at: string
  icon: IconName
  tint: string
  tintSoft: string
  title: string
  subtitle: string
  status: { label: string; fg: string; bg: string }
  href: Href
}

function toActivity(data: DashboardStats): ActivityItem[] {
  const called = (b: Booking) =>
    b.contactedAt
      ? { label: 'Called', fg: colors.success, bg: colors.successSoft }
      : { label: 'Not called', fg: colors.warning, bg: colors.warningSoft }

  const callbacks = data.recentCallbacks.map<ActivityItem>((b) => ({
    key: `c${b.id}`,
    at: b.createdAt,
    icon: 'call',
    tint: colors.gold600,
    tintSoft: colors.warningSoft,
    title: b.name || 'Call-back request',
    subtitle: b.message ? `“${b.message}”` : b.phone || 'Call-back request',
    status: called(b),
    href: { pathname: '/requests', params: { view: 'callbacks' } },
  }))
  const bookings = data.recentBookings.map<ActivityItem>((b) => ({
    key: `b${b.id}`,
    at: b.createdAt,
    icon: 'car',
    tint: colors.info,
    tintSoft: colors.infoSoft,
    title: b.service,
    subtitle: [b.name, [b.pickup, b.drop].filter(Boolean).join(' → ')].filter(Boolean).join(' · ') || 'Ride booking',
    status: called(b),
    href: { pathname: '/requests', params: { view: 'bookings' } },
  }))
  const enquiries = data.recentEnquiries.map<ActivityItem>((e: EnquirySummary) => ({
    key: `e${e.id}`,
    at: e.createdAt,
    icon: 'chatbubbles',
    tint: colors.success,
    tintSoft: colors.successSoft,
    title: e.name,
    subtitle: e.package?.title ?? 'Package enquiry',
    status: enquiryStatusMeta[e.status],
    href: { pathname: '/enquiries/[id]', params: { id: String(e.id) } },
  }))

  return [...callbacks, ...bookings, ...enquiries].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8)
}

function ActivityFeed({ data }: { data: DashboardStats }) {
  const items = toActivity(data)
  if (items.length === 0) {
    return (
      <View style={[styles.feed, styles.feedEmpty]}>
        <Ionicons color={colors.gold500} name="sparkles-outline" size={28} />
        <Text style={styles.feedEmptyText}>New bookings and enquiries from your website will show up here.</Text>
      </View>
    )
  }

  return (
    <View style={styles.feed}>
      {items.map((item, index) => (
        <Pressable
          key={item.key}
          onPress={() => router.push(item.href)}
          style={({ pressed }) => [styles.feedRow, index > 0 && styles.feedDivider, pressed && { backgroundColor: colors.ivory }]}
        >
          <View style={[styles.feedIcon, { backgroundColor: item.tintSoft }]}>
            <Ionicons color={item.tint} name={item.icon} size={18} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={styles.feedTitleRow}>
              <Text numberOfLines={1} style={styles.feedTitle}>
                {item.title}
              </Text>
              <Text style={styles.feedTime}>{timeAgo(item.at)}</Text>
            </View>
            <View style={styles.feedTitleRow}>
              <Text numberOfLines={1} style={styles.feedSubtitle}>
                {item.subtitle}
              </Text>
              <View style={[styles.pill, { backgroundColor: item.status.bg }]}>
                <Text style={[styles.pillText, { color: item.status.fg }]}>{item.status.label}</Text>
              </View>
            </View>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  hero: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  date: { fontSize: 13, color: colors.gold300, fontWeight: '600', letterSpacing: 0.3 },
  greeting: { fontSize: 24, fontWeight: '800', color: colors.ivory, marginTop: 2 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.gold500,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: colors.navy950 },
  heroLine: { fontSize: 15, color: 'rgba(251,249,244,0.8)', marginTop: spacing.lg },
  attentionRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  attention: {
    flex: 1,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: spacing.xs,
  },
  attentionHot: { backgroundColor: colors.gold500, borderColor: colors.gold300 },
  attentionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attentionCount: { fontSize: 30, fontWeight: '800', color: colors.ivory, marginTop: spacing.xs },
  attentionFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  attentionLabel: { fontSize: 13, fontWeight: '600', color: 'rgba(251,249,244,0.8)' },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginTop: -36,
  },
  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: 2,
    ...shadow,
    shadowOpacity: 0.1,
    elevation: 4,
  },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
  statSub: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  statLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '500' },

  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  link: { color: colors.gold600, fontWeight: '700' },

  actions: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  actionPrimary: { backgroundColor: colors.gold500, borderColor: colors.gold500 },
  actionLabel: { fontSize: 13, fontWeight: '700', color: colors.navy800 },

  feed: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow,
  },
  feedEmpty: { alignItems: 'center', gap: spacing.sm, padding: spacing.xl },
  feedEmptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 14 },
  feedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  feedDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  feedIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  feedTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  feedTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  feedTime: { fontSize: 12, color: colors.textMuted },
  feedSubtitle: { flex: 1, fontSize: 13, color: colors.textMuted },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill },
  pillText: { fontSize: 11, fontWeight: '700' },
})
