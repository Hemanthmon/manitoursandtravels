import type { EnquiryStatus, EnquiryType, PriceUnit } from '@/api/types'

import { colors } from './theme'

export function formatPrice(amount: number, unit?: PriceUnit) {
  const value = `₹${amount.toLocaleString('en-IN')}`
  return unit ? `${value} ${priceUnitLabels[unit].toLowerCase()}` : value
}

export const priceUnitLabels: Record<PriceUnit, string> = {
  PER_PERSON: 'Per person',
  PER_GROUP: 'Per group',
  PER_VEHICLE: 'Per vehicle',
}

// Same output as the website's formatDuration (src/lib/format.ts).
export function formatDuration(days: number, nights: number) {
  if (!days && !nights) return ''
  if (days && nights) return `${days}D/${nights}N`
  if (days) return `${days} Day${days > 1 ? 's' : ''}`
  return `${nights} Night${nights > 1 ? 's' : ''}`
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function timeAgo(iso: string) {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

export const enquiryTypeLabels: Record<EnquiryType, string> = {
  AIRPORT_TRANSFER: 'Airport transfer',
  CITY_RIDE: 'City ride',
  SCHOOL_TRANSPORT: 'School transport',
  TOUR_PACKAGE: 'Tour package',
  GENERAL: 'General',
}

export const enquiryStatusMeta: Record<EnquiryStatus, { label: string; fg: string; bg: string }> = {
  NEW: { label: 'New', fg: colors.info, bg: colors.infoSoft },
  CONTACTED: { label: 'Contacted', fg: colors.warning, bg: colors.warningSoft },
  QUOTED: { label: 'Quoted', fg: colors.navy700, bg: colors.ivoryDim },
  BOOKED: { label: 'Booked', fg: colors.success, bg: colors.successSoft },
  LOST: { label: 'Lost', fg: colors.textMuted, bg: '#f2f4f7' },
}

// Indian numbers are stored in mixed formats ("98450 12345", "+91…"); WhatsApp
// needs digits with a country code.
export function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 ? `91${digits}` : digits
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

// "Mani Admin" -> "MA"; falls back to the email ("test@gmail.com" -> "TG").
export function initials(name: string | null | undefined, email: string | undefined) {
  const source = name?.trim() || email || '?'
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
