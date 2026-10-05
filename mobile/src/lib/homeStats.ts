import type { Ionicons } from '@expo/vector-icons'

import type { HomeStatIcon } from '@/api/types'

// Same icon keys as the website (src/lib/homeStats.ts). Each maps to the
// closest Ionicon so the preview here matches the home page.
export const homeStatIcons: Record<HomeStatIcon, keyof typeof Ionicons.glyphMap> = {
  shield: 'shield-checkmark-outline',
  car: 'car-outline',
  users: 'people-outline',
  clock: 'time-outline',
  star: 'star-outline',
  map: 'location-outline',
  plane: 'airplane-outline',
  award: 'ribbon-outline',
  heart: 'heart-outline',
  calendar: 'calendar-outline',
}

// "42000" -> "42,000" for the preview (the website formats it the same way).
export function formatStatValue(value: string) {
  const digits = value.replace(/,/g, '')
  return /^\d+$/.test(digits) ? Number(digits).toLocaleString('en-IN') : value
}
