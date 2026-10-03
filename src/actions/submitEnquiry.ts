'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'

import { prisma } from '@/lib/prisma'
import { packageEnquirySchema } from '@/lib/validation/enquirySchema'
import { verifyTurnstileToken } from '@/lib/turnstile'
import { notifyAdmins } from '@/server/notifications'

export type SubmitEnquiryResult = { success: true } | { success: false; error: string }

export async function submitPackageEnquiry(input: unknown): Promise<SubmitEnquiryResult> {
  const parsed = packageEnquirySchema.safeParse(input)

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Please check the form and try again.' }
  }

  const { name, phone, travelDate, pax, message, packageId, turnstileToken, company } = parsed.data

  // Honeypot — a real visitor never fills this field in.
  if (company) {
    return { success: false, error: 'Something went wrong. Please try again.' }
  }

  const headersList = await headers()
  const remoteIp = headersList.get('x-forwarded-for')?.split(',')[0]?.trim()

  const verified = await verifyTurnstileToken(turnstileToken, remoteIp)
  if (!verified) {
    return { success: false, error: 'Verification failed. Please try again.' }
  }

  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    select: { id: true, destinationId: true, title: true },
  })
  if (!pkg) {
    return { success: false, error: 'This package could not be found.' }
  }

  const enquiry = await prisma.enquiry.create({
    data: {
      name,
      phone,
      type: 'TOUR_PACKAGE',
      packageId: pkg.id,
      destinationId: pkg.destinationId,
      travelDate: travelDate ? new Date(travelDate) : undefined,
      pax,
      message: message || undefined,
      source: 'package-detail-page',
    },
  })

  after(() =>
    notifyAdmins({
      title: `New enquiry: ${pkg.title}`,
      body: [name, phone, pax ? `${pax} pax` : null].filter(Boolean).join(' · '),
      data: { screen: 'enquiry', id: enquiry.id },
    }),
  )

  return { success: true }
}
