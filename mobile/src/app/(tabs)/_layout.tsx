import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import type { ColorValue } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useDashboard } from '@/api/hooks'
import { colors } from '@/lib/theme'

type IconName = keyof typeof Ionicons.glyphMap

function tabIcon(name: IconName, focusedName: IconName) {
  return ({ color, focused }: { color: ColorValue; focused: boolean; size: number }) => (
    <Ionicons color={color} name={focused ? focusedName : name} size={23} />
  )
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const { data } = useDashboard()
  // Everything waiting on the admin: uncalled call-backs + new enquiries.
  const waiting = (data?.pendingCallbackCount ?? 0) + (data?.newEnquiryCount ?? 0)

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy900 },
        headerTintColor: colors.ivory,
        headerTitleStyle: { fontWeight: '700' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.navy900,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', headerShown: false, tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="packages"
        options={{ title: 'Packages', tabBarIcon: tabIcon('map-outline', 'map') }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: tabIcon('file-tray-outline', 'file-tray-full'),
          tabBarBadge: waiting > 0 ? waiting : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.gold500, color: colors.navy950, fontWeight: '800' },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', headerShown: false, tabBarIcon: tabIcon('person-circle-outline', 'person-circle') }}
      />
    </Tabs>
  )
}
