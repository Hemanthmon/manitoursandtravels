import { Award, CalendarDays, Car, Clock, Heart, MapPin, Plane, Shield, Star, Users, type LucideIcon } from 'lucide-react'

import type { HomeStatIcon as HomeStatIconKey } from '@/lib/homeStats'

// Keep in sync with the app's map in mobile/src/lib/homeStats.ts.
export const homeStatIconComponents: Record<HomeStatIconKey, LucideIcon> = {
  shield: Shield,
  car: Car,
  users: Users,
  clock: Clock,
  star: Star,
  map: MapPin,
  plane: Plane,
  award: Award,
  heart: Heart,
  calendar: CalendarDays,
}

export function HomeStatIcon({ icon, className }: { icon: HomeStatIconKey; className?: string }) {
  const Icon = homeStatIconComponents[icon]
  return <Icon className={className} />
}
