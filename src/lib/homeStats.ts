import { z } from 'zod'

// The 4 "proof numbers" in the home page's Why Us section ("42,000+ Rides
// completed"). Admins edit them from Website Stats in the web admin or the
// app, so they're stored as JSON on SiteSettings.homeStats.

export const HOME_STAT_SLOTS = 4

// Icon keys only; the website maps them to lucide icons and the app to
// Ionicons, so keep both maps in sync when adding one.
export const homeStatIcons = ['shield', 'car', 'users', 'clock', 'star', 'map', 'plane', 'award', 'heart', 'calendar'] as const
export type HomeStatIcon = (typeof homeStatIcons)[number]

export const homeStatSchema = z.object({
  icon: z.enum(homeStatIcons),
  // A number ("42000", "42,000") counts up on the site; anything else
  // ("24×7", "4.9★") is shown as typed. Empty hides the card.
  value: z.string().trim().max(12, 'Keep the number short (12 characters max)'),
  suffix: z.string().trim().max(3, 'Use at most 3 characters, like +'),
  label: z.string().trim().max(40, 'Keep the label short (40 characters max)'),
})

export const homeStatsSchema = z
  .array(homeStatSchema)
  .length(HOME_STAT_SLOTS)
  .superRefine((stats, ctx) => {
    stats.forEach((stat, index) => {
      if (stat.value && !stat.label) {
        ctx.addIssue({ code: 'custom', path: [index, 'label'], message: 'Add a label so visitors know what this number means' })
      }
    })
  })

export type HomeStat = z.infer<typeof homeStatSchema>

type LegacyCounts = {
  yearsInBusiness?: number | null
  ridesCompleted?: number | null
  familiesServed?: number | null
  homeStats?: unknown
} | null

// Saved stats, or (before anyone has saved them) the original layout built
// from the old yearsInBusiness / ridesCompleted / familiesServed columns.
export function resolveHomeStats(settings: LegacyCounts): HomeStat[] {
  const saved = homeStatsSchema.safeParse(settings?.homeStats)
  if (saved.success) return saved.data

  const count = (n?: number | null) => (n ? String(n) : '')
  return [
    { icon: 'shield', value: count(settings?.yearsInBusiness), suffix: '+', label: 'Years on the road' },
    { icon: 'car', value: count(settings?.ridesCompleted), suffix: '+', label: 'Rides completed' },
    { icon: 'users', value: count(settings?.familiesServed), suffix: '+', label: 'Families served' },
    { icon: 'clock', value: '24×7', suffix: '', label: 'Dispatch, every day' },
  ]
}

// "42,000" -> 42000 (animated count-up); "24×7" -> null (shown as text).
export function homeStatNumber(value: string): number | null {
  const digits = value.replace(/,/g, '')
  return /^\d+$/.test(digits) ? Number(digits) : null
}
