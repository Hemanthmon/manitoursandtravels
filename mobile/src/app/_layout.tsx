import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { AppState, Platform } from 'react-native'

import { ApiError } from '@/api/client'
import { AuthProvider, useAuth } from '@/auth/AuthProvider'
import { usePushNotifications } from '@/lib/notifications'
import { colors } from '@/lib/theme'

SplashScreen.preventAutoHideAsync()

// React Query can't see app focus on native by itself. Wire it to AppState so
// lists refetch the moment the app is reopened, and polling pauses in background.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener('change', (state) => setFocused(state === 'active'))
    return () => subscription.remove()
  })
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        // Don't hammer the server on auth/validation errors — only retry transient ones.
        retry: (failureCount, error) =>
          failureCount < 2 && !(error instanceof ApiError && error.status && error.status < 500),
      },
    },
  })
}

function RootNavigator() {
  const { user, isRestoring } = useAuth()
  usePushNotifications(!!user && !isRestoring)

  useEffect(() => {
    if (!isRestoring) SplashScreen.hideAsync()
  }, [isRestoring])

  if (isRestoring) return null

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.ivory,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="packages/new" options={{ title: 'New package' }} />
        <Stack.Screen name="packages/[id]" options={{ title: 'Edit package' }} />
        <Stack.Screen name="enquiries/[id]" options={{ title: 'Enquiry' }} />
        <Stack.Screen name="website-stats" options={{ title: 'Website stats' }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  )
}
