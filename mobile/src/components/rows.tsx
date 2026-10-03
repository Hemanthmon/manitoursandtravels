import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native'

import { useMarkContacted } from '@/api/hooks'
import type { Booking, EnquirySummary } from '@/api/types'
import { enquiryStatusMeta, enquiryTypeLabels, formatDate, timeAgo, toWhatsAppNumber } from '@/lib/format'
import { colors, radius, spacing } from '@/lib/theme'

import { Badge, Card } from './ui'

async function openUrl(url: string) {
  try {
    await Linking.openURL(url)
  } catch {
    Alert.alert('Could not open', 'No app on this phone can handle that action.')
  }
}

// onCall runs when Call is tapped (used to mark the lead as contacted).
export function ContactButtons({ phone, onCall }: { phone: string; onCall?: () => void }) {
  return (
    <View style={styles.contact}>
      <Pressable
        accessibilityLabel={`Call ${phone}`}
        onPress={() => {
          onCall?.()
          void openUrl(`tel:${phone.replace(/\s/g, '')}`)
        }}
        style={[styles.contactButton, { backgroundColor: colors.infoSoft }]}
      >
        <Ionicons color={colors.info} name="call" size={18} />
      </Pressable>
      <Pressable
        accessibilityLabel={`WhatsApp ${phone}`}
        onPress={() => openUrl(`https://wa.me/${toWhatsAppNumber(phone)}`)}
        style={[styles.contactButton, { backgroundColor: colors.successSoft }]}
      >
        <Ionicons color={colors.success} name="logo-whatsapp" size={18} />
      </Pressable>
    </View>
  )
}

export function BookingRow({ booking }: { booking: Booking }) {
  const markContacted = useMarkContacted('bookings')
  const route = [booking.pickup, booking.drop].filter(Boolean).join('  →  ')
  const when = [booking.date, booking.time].filter(Boolean).join(' · ')

  return (
    <Card style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <Text numberOfLines={1} style={styles.title}>
            {booking.service}
          </Text>
          <Text style={styles.meta}>{timeAgo(booking.createdAt)}</Text>
        </View>
        {route ? <Detail icon="navigate-outline" text={route} /> : null}
        {when ? <Detail icon="calendar-outline" text={when} /> : null}
        <Detail icon="person-outline" text={booking.name || 'No name given'} />
        <CalledBadge contactedAt={booking.contactedAt} />
      </View>
      {booking.phone ? (
        <ContactButtons
          onCall={() => {
            if (!booking.contactedAt) markContacted.mutate(booking.id)
          }}
          phone={booking.phone}
        />
      ) : null}
    </Card>
  )
}

// A "Prefer a call back?" request: just a name, number and optional message.
export function CallbackRow({ callback }: { callback: Booking }) {
  const markContacted = useMarkContacted('bookings')

  return (
    <Card style={styles.row}>
      <View style={styles.rowMain}>
        <View style={styles.rowHeader}>
          <Text numberOfLines={1} style={styles.title}>
            {callback.name || 'No name given'}
          </Text>
          <Text style={styles.meta}>{timeAgo(callback.createdAt)}</Text>
        </View>
        {callback.phone ? <Text style={styles.subtitle}>{callback.phone}</Text> : null}
        {callback.message ? (
          <Text numberOfLines={4} style={styles.message}>
            “{callback.message}”
          </Text>
        ) : null}
        <CalledBadge contactedAt={callback.contactedAt} />
      </View>
      {callback.phone ? (
        <ContactButtons
          onCall={() => {
            if (!callback.contactedAt) markContacted.mutate(callback.id)
          }}
          phone={callback.phone}
        />
      ) : null}
    </Card>
  )
}

function CalledBadge({ contactedAt }: { contactedAt: string | null }) {
  return (
    <View style={styles.badges}>
      {contactedAt ? (
        <Badge bg={colors.successSoft} fg={colors.success} label={`Called ${timeAgo(contactedAt)}`} />
      ) : (
        <Badge bg={colors.ivoryDim} fg={colors.gold600} label="Not called yet" />
      )}
    </View>
  )
}

export function EnquiryRow({ enquiry }: { enquiry: EnquirySummary }) {
  const status = enquiryStatusMeta[enquiry.status]

  return (
    <Link asChild href={{ pathname: '/enquiries/[id]', params: { id: String(enquiry.id) } }}>
      <Pressable style={({ pressed }) => pressed && { opacity: 0.8 }}>
        <Card style={styles.row}>
          <View style={styles.rowMain}>
            <View style={styles.rowHeader}>
              <Text numberOfLines={1} style={styles.title}>
                {enquiry.name}
              </Text>
              <Text style={styles.meta}>{timeAgo(enquiry.createdAt)}</Text>
            </View>
            <Text numberOfLines={1} style={styles.subtitle}>
              {enquiry.package?.title ?? enquiryTypeLabels[enquiry.type]}
            </Text>
            <View style={styles.badges}>
              <Badge bg={status.bg} fg={status.fg} label={status.label} />
              {enquiry.travelDate ? (
                <Text style={styles.meta}>Travel {formatDate(enquiry.travelDate)}</Text>
              ) : null}
              {enquiry.pax ? <Text style={styles.meta}>· {enquiry.pax} pax</Text> : null}
            </View>
          </View>
          <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
        </Card>
      </Pressable>
    </Link>
  )
}

function Detail({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.detail}>
      <Ionicons color={colors.textMuted} name={icon} size={14} />
      <Text numberOfLines={1} style={styles.detailText}>
        {text}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowMain: { flex: 1, gap: 4 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  subtitle: { fontSize: 14, color: colors.navy700 },
  meta: { fontSize: 12, color: colors.textMuted },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  detail: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { flex: 1, fontSize: 14, color: colors.textMuted },
  message: { fontSize: 14, fontStyle: 'italic', color: colors.text, marginTop: 2 },
  contact: { gap: spacing.sm },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
