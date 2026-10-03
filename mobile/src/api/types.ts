// Response shapes of the Next.js /api/mobile endpoints (dates arrive as ISO strings).

export type PriceUnit = 'PER_PERSON' | 'PER_GROUP' | 'PER_VEHICLE'
export type Meal = 'BREAKFAST' | 'LUNCH' | 'DINNER'

export type ItineraryDay = {
  title: string
  description: string | null
  meals: Meal[]
  overnightAt: string | null
}
export type EnquiryStatus = 'NEW' | 'CONTACTED' | 'QUOTED' | 'BOOKED' | 'LOST'
export type EnquiryType =
  | 'AIRPORT_TRANSFER'
  | 'CITY_RIDE'
  | 'SCHOOL_TRANSPORT'
  | 'TOUR_PACKAGE'
  | 'GENERAL'

export type AdminUser = { id: number; email: string; name: string | null }

export type LoginResponse = { token: string; expiresAt: string; user: AdminUser }

export type Page<T> = { items: T[]; nextCursor: number | null }

export type Booking = {
  id: number
  service: string
  pickup: string | null
  drop: string | null
  date: string | null
  time: string | null
  name: string | null
  phone: string | null
  // Optional note left with a call-back request
  message: string | null
  // 'hero-booking' (Book Your Ride form) or 'callback' (call-back request)
  // Bookings and call-backs share this shape; the API filters them with ?kind=
  source: string | null
  // First time an admin tapped Call; null = not called yet
  contactedAt: string | null
  createdAt: string
}

export type EnquirySummary = {
  id: number
  name: string
  phone: string
  email: string | null
  type: EnquiryType
  status: EnquiryStatus
  travelDate: string | null
  pax: number | null
  message: string | null
  contactedAt: string | null
  createdAt: string
  package: { id: number; title: string } | null
}

export type EnquiryDetail = EnquirySummary & {
  notes: string | null
  source: string | null
  schoolName: string | null
  pickupLocation: string | null
  numberOfChildren: number | null
  startDate: string | null
  updatedAt: string
  destination: { id: number; name: string } | null
  assignedTo: { id: number; name: string | null; email: string } | null
}

export type PackageSummary = {
  id: number
  slug: string
  title: string
  imageUrl: string | null
  summary: string
  durationDays: number
  durationNights: number
  priceFrom: number
  priceUnit: PriceUnit
  featured: boolean
  published: boolean
  updatedAt: string
  destination: { id: number; name: string }
  _count?: { itineraryDays: number }
}

export type PackageDetail = PackageSummary & {
  destinationId: number
  description: string | null
  bestSeason: string | null
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  metaTitle: string | null
  metaDescription: string | null
  categories: { id: number; title: string }[]
  itineraryDays: (ItineraryDay & { dayNumber: number })[]
}

// Body for POST /packages and PUT /packages/:id — validated server-side by the
// same zod schema the web admin uses.
export type PackageInput = {
  // Empty = generated from the title on the server.
  slug: string
  title: string
  destinationId: number
  categoryIds: number[]
  imageUrl: string
  summary: string
  description: string
  durationDays: number
  durationNights: number
  priceFrom: number
  priceUnit: PriceUnit
  bestSeason: string
  highlights: string[]
  inclusions: string[]
  exclusions: string[]
  featured: boolean
  published: boolean
  metaTitle: string
  metaDescription: string
  itinerary: { title: string; description: string; meals: Meal[]; overnightAt: string }[]
}

export type Lookups = {
  destinations: { id: number; name: string }[]
  categories: { id: number; title: string }[]
  priceUnits: PriceUnit[]
  meals: Meal[]
  enquiryStatuses: EnquiryStatus[]
}

export type DashboardStats = {
  packageCount: number
  publishedCount: number
  bookingCount: number
  bookingsToday: number
  enquiryCount: number
  newEnquiryCount: number
  recentBookings: Booking[]
  callbackCount: number
  // Call-back requests nobody has called yet
  pendingCallbackCount: number
  recentCallbacks: Booking[]
  recentEnquiries: EnquirySummary[]
}
