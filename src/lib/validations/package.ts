import { z } from 'zod'

export const priceUnitValues = ['PER_PERSON', 'PER_GROUP', 'PER_VEHICLE'] as const
export const mealValues = ['BREAKFAST', 'LUNCH', 'DINNER'] as const

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
}

const itineraryDaySchema = z.object({
  title: z.string().trim().min(1, 'Give each day a title').max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')),
  meals: z.array(z.enum(mealValues)).default([]),
  overnightAt: z.string().trim().max(200).optional().or(z.literal('')),
})

// Shared by the web admin and the mobile app. Both send this same JSON shape
// from their step-by-step package editors.
export const packageSchema = z.object({
  // Optional: generated from the title when left empty (see savePackage).
  slug: z
    .string()
    .trim()
    .regex(slugPattern, 'Use lowercase letters, numbers and hyphens only')
    .optional()
    .or(z.literal('')),
  title: z.string().trim().min(1, 'Package name is required').max(200),
  destinationId: z.number().int().positive('Choose a destination'),
  categoryIds: z.array(z.number().int()).default([]),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  summary: z.string().trim().min(1, 'Add a short summary').max(500),
  description: z.string().optional().or(z.literal('')),
  durationDays: z.number({ error: 'Enter the number of days' }).int().min(1, 'At least 1 day').max(60),
  durationNights: z.number({ error: 'Enter the number of nights' }).int().min(0, 'Must be 0 or more').max(60),
  priceFrom: z.number({ error: 'Enter a price' }).int().min(0, 'Must be 0 or more'),
  priceUnit: z.enum(priceUnitValues),
  bestSeason: z.string().optional().or(z.literal('')),
  highlights: z.array(z.string().trim().min(1)).default([]),
  inclusions: z.array(z.string().trim().min(1)).default([]),
  exclusions: z.array(z.string().trim().min(1)).default([]),
  itinerary: z.array(itineraryDaySchema).max(60).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(false),
  metaTitle: z.string().optional().or(z.literal('')),
  metaDescription: z.string().optional().or(z.literal('')),
})

export type PackageInput = z.input<typeof packageSchema>
export type PackageFormValues = z.infer<typeof packageSchema>

export const newTaxonomySchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(80, 'Name is too long'),
})
