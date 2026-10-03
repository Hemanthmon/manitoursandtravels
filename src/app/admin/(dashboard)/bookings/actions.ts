'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { auth } from '@/auth'
import { markBookingContacted } from '@/server/admin/crm'

export async function markBookingContactedAction(id: number) {
  const session = await auth()
  if (!session?.user) redirect('/admin/login')

  await markBookingContacted(id)
  revalidatePath('/admin/bookings')
  revalidatePath('/admin/callbacks')
  revalidatePath('/admin')
}
