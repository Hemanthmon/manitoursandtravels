'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { cn } from '@/utilities/ui'

import { togglePublishedAction } from './actions'

export function PublishedToggle({ id, published }: { id: number; published: boolean }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      aria-pressed={published}
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium transition disabled:opacity-60',
        published
          ? 'bg-emerald-100 text-emerald-600'
          : 'bg-ivory-dim text-muted-brand hover:text-navy-900',
      )}
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await togglePublishedAction(id, !published)
          router.refresh()
        })
      }
      type="button"
    >
      {published ? 'Published' : 'Draft'}
    </button>
  )
}
