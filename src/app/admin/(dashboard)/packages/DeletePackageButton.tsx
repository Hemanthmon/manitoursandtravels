'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

import { deletePackageAction } from './actions'

export function DeletePackageButton({ id, title }: { id: number; title: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <button
      className="text-destructive hover:underline disabled:opacity-60"
      disabled={isPending}
      onClick={() => {
        if (window.confirm(`Delete "${title}"? This cannot be undone.`)) {
          startTransition(async () => {
            await deletePackageAction(id)
            router.refresh()
          })
        }
      }}
      type="button"
    >
      {isPending ? 'Deleting…' : 'Delete'}
    </button>
  )
}
