import { useQueryClient } from '@tanstack/react-query'
import Constants, { ExecutionEnvironment } from 'expo-constants'
import * as Device from 'expo-device'
import type * as NotificationsModule from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { Platform } from 'react-native'

import { API_URL, getAuthToken, toApiError } from '@/api/client'
import { colors } from '@/lib/theme'

// New-lead push notifications. The server (src/server/notifications.ts in the
// website) sends to every registered admin phone through Expo's push service.

type LeadData = { screen?: 'bookings' | 'callbacks' } | { screen: 'enquiry'; id: number }

// Expo Go (SDK 53+) removed push support on Android, and expo-notifications
// errors there as soon as it's used. Load it only in a real build (dev build
// or APK); in Expo Go every function below quietly does nothing.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Notifications: typeof NotificationsModule | null = isExpoGo ? null : require('expo-notifications')

// Show alerts even while the app is open.
Notifications?.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

let registeredToken: string | null = null

async function getExpoPushToken(): Promise<string | null> {
  if (!Notifications) {
    console.warn('Push notifications do not work in Expo Go. Install a development build or the APK.')
    return null
  }
  if (!Device.isDevice) {
    console.warn('Push notifications need a real phone, not an emulator.')
    return null
  }

  if (Platform.OS === 'android') {
    // Matches channelId: 'leads' in the server's push payload.
    await Notifications.setNotificationChannelAsync('leads', {
      name: 'New bookings & enquiries',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: colors.gold500,
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  const status = existing.granted ? existing.status : (await Notifications.requestPermissionsAsync()).status
  if (status !== 'granted') return null

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    console.warn('No EAS projectId in app config. Run `npx eas-cli init` in mobile/ to enable push.')
    return null
  }

  return (await Notifications.getExpoPushTokenAsync({ projectId })).data
}

// Plain fetch instead of the axios instance: these run during sign-in/out and
// must never trigger the global 401 -> sign-out handler.
async function sendToken(method: 'POST' | 'DELETE', token: string) {
  const response = await fetch(`${API_URL}/push-tokens`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getAuthToken() ?? ''}` },
    body: JSON.stringify({ token }),
  })
  if (!response.ok) throw new Error(`push-tokens ${method} failed (${response.status})`)
}

export async function registerForPushNotifications() {
  try {
    const token = await getExpoPushToken()
    if (!token) return
    await sendToken('POST', token)
    registeredToken = token
  } catch (error) {
    console.warn('Push registration:', toApiError(error).message)
  }
}

// Best-effort, called on sign-out while the auth token is still set.
export async function unregisterPushNotifications() {
  const token = registeredToken
  registeredToken = null
  if (!token) return
  try {
    await sendToken('DELETE', token)
  } catch (error) {
    console.warn('Push unregister:', toApiError(error).message)
  }
}

function openLead(data: LeadData | undefined) {
  if (data?.screen === 'enquiry' && 'id' in data) {
    router.push({ pathname: '/enquiries/[id]', params: { id: String(data.id) } })
  } else if (data?.screen === 'bookings' || data?.screen === 'callbacks') {
    router.push({ pathname: '/requests', params: { view: data.screen } })
  }
}

// Mount once while signed in: registers this phone, refreshes lists when a
// lead arrives, and opens the right screen when a notification is tapped.
export function usePushNotifications(enabled: boolean) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (enabled) void registerForPushNotifications()
  }, [enabled])

  useEffect(() => {
    if (!enabled || !Notifications) return
    const N = Notifications

    const received = N.addNotificationReceivedListener(() => {
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      void queryClient.invalidateQueries({ queryKey: ['bookings'] })
      void queryClient.invalidateQueries({ queryKey: ['callbacks'] })
      void queryClient.invalidateQueries({ queryKey: ['enquiries'] })
    })

    const handleTap = (response: NotificationsModule.NotificationResponse | null) => {
      if (!response || response.actionIdentifier !== N.DEFAULT_ACTION_IDENTIFIER) return
      openLead(response.notification.request.content.data as LeadData | undefined)
      void N.clearLastNotificationResponseAsync()
    }
    // Taps while the app is running...
    const tapped = N.addNotificationResponseReceivedListener(handleTap)
    // ...and the tap that launched the app from closed.
    void N.getLastNotificationResponseAsync().then(handleTap)

    return () => {
      received.remove()
      tapped.remove()
    }
  }, [enabled, queryClient])
}

export type PushStatus = 'expo-go' | 'emulator' | 'granted' | 'denied' | 'undetermined'

// Shown on the Profile screen so admins know whether lead alerts will arrive.
export async function getPushStatus(): Promise<PushStatus> {
  if (!Notifications) return 'expo-go'
  if (!Device.isDevice) return 'emulator'
  const { status } = await Notifications.getPermissionsAsync()
  return status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined'
}
