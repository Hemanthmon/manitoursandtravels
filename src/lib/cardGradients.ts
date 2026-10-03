/**
 * Gradient-scrim fallback backgrounds for package/tour cards that have no hero image.
 * These are the exact 4 gradients introduced on the landing page's Tours section —
 * reused here, not new colors, just cycled deterministically by slug.
 */
const CARD_GRADIENTS = [
  'linear-gradient(150deg,#1E7A5F,#0F2544 70%)',
  'linear-gradient(150deg,#2C5F3F,#0A1A30 70%)',
  'linear-gradient(150deg,#B9862A,#0F2544 70%)',
  'linear-gradient(150deg,#274469,#081426 70%)',
]

export function getCardGradient(key: string): string {
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % CARD_GRADIENTS.length
  return CARD_GRADIENTS[index]
}
