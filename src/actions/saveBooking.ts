'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { notifyAdmins } from '@/server/notifications'

export type LeadResult = { success: true } | { success: false; error: string }

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[+\d][\d\s-]{6,18}$/, 'Please enter a valid phone number')

const contactSchema = {
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: phoneSchema,
  // Honeypot: a hidden field real visitors never fill in; bots usually do.
  company: z.string().max(0).optional().or(z.literal('')),
}

const bookingSchema = z.object({
  service: z.string().trim().min(1, 'Please choose a service').max(100),
  pickup: z.string().trim().max(300).optional().or(z.literal('')),
  drop: z.string().trim().max(300).optional().or(z.literal('')),
  date: z.string().max(20).optional().or(z.literal('')),
  time: z.string().max(20).optional().or(z.literal('')),
  ...contactSchema,
})

const callbackSchema = z.object({
  ...contactSchema,
  message: z.string().trim().max(1000, 'Message is too long').optional().or(z.literal('')),
})

// Best-effort flood guard per visitor IP (in-memory, so per server instance).
// Each submission pushes a notification to every admin phone, so cap it.
const WINDOW_MS = 10 * 60 * 1000
const MAX_SUBMISSIONS = 5
const submissions = new Map<string, { count: number; resetAt: number }>()

async function isRateLimited() {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const now = Date.now()
  const entry = submissions.get(ip)
  if (!entry || entry.resetAt < now) {
    submissions.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  entry.count += 1
  return entry.count > MAX_SUBMISSIONS
}

const RATE_LIMITED = 'Too many requests. Please call us directly or try again in a few minutes.'
const GENERIC_ERROR = 'Something went wrong. Please try again.'

// Hero "Book Your Ride" form.
export async function saveBookingAction(input: unknown): Promise<LeadResult> {
  const parsed = bookingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Please check the form and try again.' }
  }
  const { service, pickup, drop, date, time, name, phone, company } = parsed.data
  if (company) return { success: false, error: GENERIC_ERROR }
  if (await isRateLimited()) return { success: false, error: RATE_LIMITED }

  await prisma.booking.create({
    data: {
      service,
      pickup: pickup || null,
      drop: drop || null,
      date: date || null,
      time: time || null,
      name,
      phone,
      source: 'hero-booking',
    },
  })

  // Runs after the response is sent, so the visitor never waits on Expo.
  after(() =>
    notifyAdmins({
      title: `New booking: ${service}`,
      body: [name, phone, [pickup, drop].filter(Boolean).join(' → ')].filter(Boolean).join(' · '),
      data: { screen: 'bookings' },
    }),
  )

  return { success: true }
}

// "Prefer a call back?" form beside the home page's final call-to-action.
export async function requestCallbackAction(input: unknown): Promise<LeadResult> {
  const parsed = callbackSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Please check the form and try again.' }
  }
  const { name, phone, message, company } = parsed.data
  if (company) return { success: false, error: GENERIC_ERROR }
  if (await isRateLimited()) return { success: false, error: RATE_LIMITED }

  await prisma.booking.create({
    data: { service: 'Callback request', name, phone, message: message || null, source: 'callback' },
  })

  after(() =>
    notifyAdmins({
      title: 'Call-back requested',
      body: [name, phone, message].filter(Boolean).join(' · ').slice(0, 180),
      data: { screen: 'callbacks' },
    }),
  )

  return { success: true }
}
