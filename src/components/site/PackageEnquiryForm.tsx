'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Turnstile } from '@/components/site/Turnstile'
import {
  packageEnquirySchema,
  type PackageEnquiryFormValues,
} from '@/lib/validation/enquirySchema'
import { submitPackageEnquiry } from '@/actions/submitEnquiry'

const fieldClass =
  'w-full rounded-[11px] border-[1.5px] border-border bg-ivory px-[14px] py-[13px] text-[0.95rem] text-ink transition-colors focus:border-gold-500 focus-visible:ring-0 focus-visible:outline-none shadow-none h-auto'

export const PackageEnquiryForm: React.FC<{ packageId: number; packageTitle: string }> = ({
  packageId,
  packageTitle,
}) => {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PackageEnquiryFormValues>({
    resolver: zodResolver(packageEnquirySchema),
    defaultValues: { packageId },
  })

  const onSubmit = async (data: PackageEnquiryFormValues) => {
    setServerError(null)
    const result = await submitPackageEnquiry(data)
    if (result.success) {
      setSubmitted(true)
    } else {
      setServerError(result.error)
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-[18px] border border-emerald-600/30 bg-emerald-100 px-6 py-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h3 className="text-[1.2rem] text-navy-900">Thanks — we&apos;ve got your enquiry.</h3>
        <p className="max-w-md text-[0.95rem] text-muted-brand">
          Our team will call or WhatsApp you shortly to plan the {packageTitle} trip.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 rounded-[18px] border border-border bg-paper p-6 md:p-7">
      {/* Honeypot — visually hidden, real visitors never fill this in */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
      </div>
      <input type="hidden" value={packageId} {...register('packageId')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700">
            Your Name
          </label>
          <Input id="name" placeholder="Full name" className={fieldClass} {...register('name')} />
          {errors.name && <p className="mt-1 text-[0.8rem] text-red-600">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700">
            Phone Number
          </label>
          <Input id="phone" type="tel" placeholder="10-digit number" className={fieldClass} {...register('phone')} />
          {errors.phone && <p className="mt-1 text-[0.8rem] text-red-600">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="travelDate" className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700">
            Travel Date
          </label>
          <Input id="travelDate" type="date" className={fieldClass} {...register('travelDate')} />
        </div>
        <div>
          <label htmlFor="pax" className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700">
            Number of Travellers
          </label>
          <Input id="pax" type="number" min={1} placeholder="e.g. 4" className={fieldClass} {...register('pax')} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-[0.78rem] font-bold uppercase tracking-[0.04em] text-navy-700">
          Message (optional)
        </label>
        <Textarea id="message" rows={3} placeholder="Anything specific we should know?" className={fieldClass} {...register('message')} />
      </div>

      <Turnstile
        onVerify={(token) => setValue('turnstileToken', token, { shouldValidate: true })}
        onExpire={() => setValue('turnstileToken', '')}
      />
      {errors.turnstileToken && <p className="text-[0.8rem] text-red-600">{errors.turnstileToken.message}</p>}

      {serverError && <p className="text-[0.85rem] text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-shine inline-flex items-center justify-center gap-2.5 rounded-full bg-gold-500 px-7 py-4 text-[1rem] font-bold text-navy-950 shadow-[0_10px_26px_-8px_rgba(212,165,55,0.55)] transition-all hover:-translate-y-0.5 hover:bg-gold-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? 'Sending…' : 'Send Enquiry'}
      </button>
    </form>
  )
}
