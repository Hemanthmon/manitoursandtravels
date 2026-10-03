import { prisma } from '@/lib/prisma'

// Push notifications to the admin mobile app via Expo's push service.
// Tokens are registered by the app (POST /api/mobile/push-tokens).

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const BATCH_SIZE = 100 // Expo accepts at most 100 messages per request

type AdminNotification = {
  title: string
  body: string
  // Tells the app which screen to open when the notification is tapped.
  data?: { screen: 'bookings' } | { screen: 'callbacks' } | { screen: 'enquiry'; id: number }
}

type ExpoTicket = { status: 'ok' | 'error'; details?: { error?: string } }

// Never throws: a failed notification must never fail the customer's form submit.
export async function notifyAdmins(notification: AdminNotification): Promise<void> {
  try {
    const tokens = (await prisma.pushToken.findMany({ select: { token: true } })).map((row) => row.token)
    if (tokens.length === 0) return

    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
    // Only needed if "Enhanced push security" is turned on in the Expo dashboard.
    if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`

    for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
      const batch = tokens.slice(i, i + BATCH_SIZE)
      const response = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            title: notification.title,
            body: notification.body,
            data: notification.data ?? {},
            sound: 'default',
            priority: 'high',
            channelId: 'leads',
          })),
        ),
      })
      if (!response.ok) {
        console.error('[notifyAdmins] Expo push failed', response.status, await response.text())
        continue
      }

      // Tickets come back in the same order as the messages. Drop tokens for
      // phones that uninstalled the app or revoked notification permission.
      const { data: tickets = [] } = (await response.json()) as { data?: ExpoTicket[] }
      const dead = batch.filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered')
      if (dead.length) await prisma.pushToken.deleteMany({ where: { token: { in: dead } } })
    }
  } catch (error) {
    console.error('[notifyAdmins]', error)
  }
}
