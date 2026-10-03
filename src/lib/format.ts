export function formatDuration(days?: number | null, nights?: number | null): string {
  if (!days && !nights) return ''
  if (days && nights) return `${days}D/${nights}N`
  if (days) return `${days} Day${days > 1 ? 's' : ''}`
  return `${nights} Night${nights && nights > 1 ? 's' : ''}`
}

const PRICE_UNIT_LABEL: Record<string, string> = {
  'per-person': '/person',
  'per-group': '/group',
  'per-vehicle': '/vehicle',
}

export function formatPriceFrom(price?: number | null, unit?: string | null): string {
  if (!price) return ''
  const amount = price.toLocaleString('en-IN')
  const suffix = unit ? (PRICE_UNIT_LABEL[unit] ?? '') : ''
  return `from ₹${amount}${suffix}`
}

export function durationBucket(days?: number | null): 'short' | 'medium' | 'long' | null {
  if (!days) return null
  if (days <= 2) return 'short'
  if (days <= 4) return 'medium'
  return 'long'
}
