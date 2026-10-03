'use client'

import React, { useState } from 'react'
import { CheckCircle2, PhoneCall } from 'lucide-react'

import { requestCallbackAction } from '@/actions/saveBooking'

const inputClass =
  'h-12 w-full rounded-full border-[1.5px] border-white/15 bg-white/[0.06] px-5 text-[0.95rem] text-paper placeholder:text-ivory/40 transition-colors focus:border-gold-500 focus:outline-none'

export const CallbackForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formElement = e.currentTarget
    const form = new FormData(formElement)

    setError(null)
    setIsSubmitting(true)
    try {
      const result = await requestCallbackAction({
        name: String(form.get('name') || '').trim(),
        phone: String(form.get('phone') || '').trim(),
        message: String(form.get('message') || '').trim(),
        company: String(form.get('company') || ''),
      })
      if (result.success) {
        formElement.reset()
        setDone(true)
      } else {
        setError(result.error)
      }
    } catch {
      setError('Could not send your request. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="rounded-[22px] border border-white/10 bg-white/[0.05] p-6 text-left backdrop-blur-[6px] md:p-8"
      id="callback"
    >
      <h3 className="text-[1.4rem] text-paper">Prefer a call back?</h3>
      <p className="mt-1.5 text-[0.92rem] text-ivory/65">
        Leave your name and number and our team will call you shortly.
      </p>

      {done ? (
        <div className="mt-6 flex items-start gap-3 text-[0.95rem] text-paper" role="status">
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-400" />
          <span>
            Thanks! We&apos;ve got your number and will call you soon.{' '}
            <button
              className="font-bold text-gold-300 underline underline-offset-4"
              onClick={() => setDone(false)}
              type="button"
            >
              Send another
            </button>
          </span>
        </div>
      ) : (
        <form className="mt-6 flex flex-col gap-3" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="sr-only" htmlFor="callbackName">
              Your name
            </label>
            <input
              autoComplete="name"
              className={inputClass}
              id="callbackName"
              maxLength={100}
              minLength={2}
              name="name"
              placeholder="Your name"
              required
            />
            <label className="sr-only" htmlFor="callbackPhone">
              Phone number
            </label>
            <input
              autoComplete="tel"
              className={inputClass}
              id="callbackPhone"
              inputMode="tel"
              maxLength={20}
              name="phone"
              placeholder="Phone number"
              required
              type="tel"
            />
          </div>
          <label className="sr-only" htmlFor="callbackMessage">
            Message (optional)
          </label>
          <textarea
            className={`${inputClass} h-auto resize-none rounded-[18px] py-3`}
            id="callbackMessage"
            maxLength={1000}
            name="message"
            placeholder="Message (optional), e.g. best time to call or where you're travelling"
            rows={3}
          />
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
            <p className="text-[0.88rem] text-red-300" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn-shine inline-flex h-12 items-center justify-center gap-2 rounded-full bg-gold-500 px-6 font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            <PhoneCall className="h-4 w-4" />
            {isSubmitting ? 'Sending…' : 'Call me back'}
          </button>
        </form>
      )}
    </div>
  )
}
