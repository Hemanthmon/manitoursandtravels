import { z } from 'zod'

export const packageEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(100),
  phone: z
    .string()
    .trim()
    .min(7, 'Please enter a valid phone number')
    .max(20, 'Please enter a valid phone number'),
  travelDate: z.string().optional().or(z.literal('')),
  pax: z.coerce.number().int().positive().max(100).optional(),
  message: z.string().max(2000).optional().or(z.literal('')),
  packageId: z.coerce.number(),
  turnstileToken: z.string().min(1, 'Please complete the verification'),
  // Honeypot — real visitors never fill this in; bots usually do.
  company: z.string().max(0).optional().or(z.literal('')),
})

// Output type (after zod's `.coerce` runs) — what the server action receives.
export type PackageEnquiryInput = z.infer<typeof packageEnquirySchema>
// Input type (before coercion) — what react-hook-form's raw field values look like.
export type PackageEnquiryFormValues = z.input<typeof packageEnquirySchema>
