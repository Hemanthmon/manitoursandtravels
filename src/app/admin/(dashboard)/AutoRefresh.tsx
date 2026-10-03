'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// Keeps admin pages in sync with new bookings/call-backs without a manual
// reload. router.refresh() re-runs the server components and merges the fresh
// data in place: no full page load, and form inputs keep what's typed.
// Polls only while the tab is visible, and refreshes right away on return.
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') router.refresh()
    }
    const timer = window.setInterval(refreshIfVisible, intervalMs)
    document.addEventListener('visibilitychange', refreshIfVisible)
    window.addEventListener('focus', refreshIfVisible)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', refreshIfVisible)
      window.removeEventListener('focus', refreshIfVisible)
    }
  }, [router, intervalMs])

  return null
}
