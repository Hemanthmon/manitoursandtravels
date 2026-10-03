'use client'

import React, { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { saveBookingAction } from '@/actions/saveBooking'

const OTHERS = 'Others'
const SERVICE_OPTIONS = [
  'Airport Pickup',
  'Airport Drop',
  'Local City Ride',
  'School Transport (Monthly)',
  OTHERS,
]

const fieldClass =
  'w-full rounded-[11px] border-[1.5px] border-border bg-ivory px-[14px] py-[11px] text-[0.95rem] text-ink transition-colors focus:border-gold-500 focus-visible:ring-0 focus-visible:outline-none shadow-none h-auto'

export const BookingWidget: React.FC = () => {
  const [tripType, setTripType] = useState(SERVICE_OPTIONS[0]!)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submittedName, setSubmittedName] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const form = new FormData(formElement)
    const otherService = String(form.get('otherService') || '').trim()
    const name = String(form.get('custName') || '').trim()

    setError(null)
    setIsSubmitting(true)
    try {
      const result = await saveBookingAction({
        service: tripType === OTHERS && otherService ? `Others: ${otherService}` : tripType,
        pickup: String(form.get('pickupArea') || '').trim(),
        drop: String(form.get('dropArea') || '').trim(),
        date: String(form.get('tripDate') || ''),
        time: String(form.get('tripTime') || ''),
        name,
        phone: String(form.get('custPhone') || '').trim(),
        company: String(form.get('company') || ''),
      })
      if (result.success) {
        formElement.reset()
        setTripType(SERVICE_OPTIONS[0]!)
        setSubmittedName(name)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Could not send your request. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submittedName) {
    return (
      <div className="relative z-[3] rounded-[22px] bg-paper p-7 text-center text-ink shadow-[0_24px_60px_-20px_rgba(8,20,38,0.35)]">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <h3 className="mt-3 text-[1.3rem]">Thank you, {submittedName.split(' ')[0]}!</h3>
        <p className="mt-2 text-[0.95rem] text-muted-brand">
          We&apos;ve received your booking request. Our team will call you shortly to confirm the
          fare and details.
        </p>
        <button
          className="mt-5 text-[0.9rem] font-bold text-navy-700 underline underline-offset-4 hover:text-gold-600"
          onClick={() => setSubmittedName(null)}
          type="button"
        >
          Book another ride
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-[3] rounded-[22px] bg-paper p-6 text-ink md:p-7 shadow-[0_24px_60px_-20px_rgba(8,20,38,0.35)]">
      <h3 className="text-[1.3rem]">Book Your Ride</h3>
      <p className="mb-4 mt-1 text-[0.9rem] text-muted-brand">
        Send your details and we&apos;ll call you back to confirm.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="tripType"
            className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
          >
            Service
          </label>
          <select
            id="tripType"
            name="tripType"
            value={tripType}
            onChange={(e) => setTripType(e.target.value)}
            className={fieldClass}
          >
            {SERVICE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {tripType === OTHERS && (
          <div>
            <label
              htmlFor="otherService"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              What do you need?
            </label>
            <Input
              id="otherService"
              name="otherService"
              placeholder="e.g. wedding car, temple visit, hourly rental"
              maxLength={80}
              className={fieldClass}
            />
          </div>
        )}

        {/* Pickup + drop side by side so the form (and hero) fit one screen. */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="pickupArea"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Pickup
            </label>
            <Input
              id="pickupArea"
              name="pickupArea"
              placeholder="Area or landmark"
              className={fieldClass}
            />
          </div>

          <div>
            <label
              htmlFor="dropArea"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Drop
            </label>
            <Input
              id="dropArea"
              name="dropArea"
              placeholder="Drop area or landmark"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="tripDate"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Date
            </label>
            <Input id="tripDate" name="tripDate" type="date" className={fieldClass} />
          </div>
          <div>
            <label
              htmlFor="tripTime"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Time
            </label>
            <Input id="tripTime" name="tripTime" type="time" className={fieldClass} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="custName"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Your Name
            </label>
            <Input id="custName" name="custName" placeholder="Full name" required minLength={2} autoComplete="name" className={fieldClass} />
          </div>
          <div>
            <label
              htmlFor="custPhone"
              className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700"
            >
              Phone Number
            </label>
            <Input
              id="custPhone"
              name="custPhone"
              type="tel"
              placeholder="10-digit number"
              required
              autoComplete="tel"
              className={fieldClass}
            />
          </div>
        </div>

        {/* Honeypot: hidden from people, bots tend to fill it in. */}
        <input
          aria-hidden="true"
          autoComplete="off"
          className="absolute left-[-9999px] h-0 w-0 opacity-0"
          name="company"
          tabIndex={-1}
          type="text"
        />

        {error && (
          <p className="rounded-[11px] bg-red-50 px-3.5 py-2.5 text-[0.88rem] text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          type="submit"
          className="btn-shine inline-flex w-full items-center justify-center gap-2.5 rounded-full bg-gold-500 px-7 py-4 text-[1rem] font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Sending…' : 'Request Booking'}
        </button>
        <div className="flex items-center gap-2 text-[0.78rem] text-muted-brand">
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-600" />
          No booking fee. We call you back to confirm the fare.
        </div>
      </form>
    </div>
  )
}
