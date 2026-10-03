'use client'

import { Phone } from 'lucide-react'
import { useTransition } from 'react'

import { markBookingContactedAction } from './actions'

// Opens the dialer and records that this customer was called.
export function CallButton({ bookingId, phone }: { bookingId: number; phone: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <a
      className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1.5 text-xs font-semibold text-paper hover:bg-navy-700 aria-disabled:opacity-60"
      aria-disabled={pending}
      href={`tel:${phone.replace(/\s/g, '')}`}
      onClick={() => startTransition(() => markBookingContactedAction(bookingId))}
    >
      <Phone className="h-3.5 w-3.5" /> Call
    </a>
  )
}
