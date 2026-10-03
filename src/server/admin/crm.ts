import { z } from 'zod'

import { prisma } from '@/lib/prisma'

import type { EnquiryStatus, Prisma } from '../../../generated/prisma/client'

// Shared CRM logic (dashboard stats, bookings, enquiries) for the web admin
// pages and the mobile admin API.

export const enquiryStatusValues = ['NEW', 'CONTACTED', 'QUOTED', 'BOOKED', 'LOST'] as const

export const enquiryUpdateSchema = z
  .object({
    status: z.enum(enquiryStatusValues).optional(),
    notes: z.string().max(5000).nullable().optional(),
  })
  .refine((value) => value.status !== undefined || value.notes !== undefined, {
    message: 'Nothing to update',
  })

// Bookings and call-back requests share the bookings table; `source` tells
// them apart. ('footer-callback' is from when the form lived in the footer.)
const CALLBACK_SOURCES = ['callback', 'footer-callback']
export const bookingKinds = ['booking', 'callback'] as const
export type BookingKind = (typeof bookingKinds)[number]

export function bookingKindWhere(kind: BookingKind): Prisma.BookingWhereInput {
  return kind === 'callback'
    ? { source: { in: CALLBACK_SOURCES } }
    : // notIn skips NULL in SQL, and older bookings have no source.
      { OR: [{ source: null }, { source: { notIn: CALLBACK_SOURCES } }] }
}

export async function getDashboardStats() {
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    packageCount,
    publishedCount,
    bookingCount,
    bookingsToday,
    enquiryCount,
    newEnquiryCount,
    recentBookings,
    callbackCount,
    pendingCallbackCount,
    recentCallbacks,
    recentEnquiries,
  ] = await Promise.all([
    prisma.package.count(),
    prisma.package.count({ where: { published: true } }),
    prisma.booking.count({ where: bookingKindWhere('booking') }),
    prisma.booking.count({ where: { ...bookingKindWhere('booking'), createdAt: { gte: startOfToday } } }),
    prisma.enquiry.count(),
    prisma.enquiry.count({ where: { status: 'NEW' } }),
    prisma.booking.findMany({ where: bookingKindWhere('booking'), orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.booking.count({ where: bookingKindWhere('callback') }),
    // Call-backs nobody has called yet.
    prisma.booking.count({ where: { ...bookingKindWhere('callback'), contactedAt: null } }),
    prisma.booking.findMany({ where: bookingKindWhere('callback'), orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { package: { select: { id: true, title: true } } },
    }),
  ])

  return {
    packageCount,
    publishedCount,
    bookingCount,
    bookingsToday,
    enquiryCount,
    newEnquiryCount,
    recentBookings,
    callbackCount,
    pendingCallbackCount,
    recentCallbacks,
    recentEnquiries,
  }
}

export async function listBookings({
  cursor,
  limit,
  kind,
}: {
  cursor?: number
  limit: number
  kind: BookingKind
}) {
  return prisma.booking.findMany({
    where: bookingKindWhere(kind),
    orderBy: { id: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  })
}

export async function listEnquiries({
  cursor,
  limit,
  status,
}: {
  cursor?: number
  limit: number
  status?: EnquiryStatus
}) {
  return prisma.enquiry.findMany({
    where: status ? { status } : undefined,
    orderBy: { id: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { package: { select: { id: true, title: true } } },
  })
}

export async function getEnquiry(id: number) {
  return prisma.enquiry.findUnique({
    where: { id },
    include: {
      package: { select: { id: true, title: true, slug: true } },
      destination: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function updateEnquiry(id: number, data: z.infer<typeof enquiryUpdateSchema>) {
  return prisma.enquiry.update({ where: { id }, data })
}

// Called when an admin taps "Call". Keeps the first call time, so repeat taps
// don't overwrite when the customer was first contacted.
export async function markBookingContacted(id: number) {
  await prisma.booking.updateMany({ where: { id, contactedAt: null }, data: { contactedAt: new Date() } })
  return prisma.booking.findUnique({ where: { id } })
}

// Same for enquiries, and moves NEW -> CONTACTED (never moves a later status back).
export async function markEnquiryContacted(id: number) {
  await prisma.$transaction([
    prisma.enquiry.updateMany({ where: { id, contactedAt: null }, data: { contactedAt: new Date() } }),
    prisma.enquiry.updateMany({ where: { id, status: 'NEW' }, data: { status: 'CONTACTED' } }),
  ])
  return prisma.enquiry.findUnique({ where: { id } })
}
