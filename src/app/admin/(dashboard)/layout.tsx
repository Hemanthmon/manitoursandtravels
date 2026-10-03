import React from 'react'

import { auth, signOut } from '@/auth'

import { AdminNav } from './AdminNav'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-navy-700 bg-navy-900 px-4 py-6">
        <div className="mb-8 px-2">
          <p className="font-head text-lg font-bold text-ivory">Mani Tours</p>
          <p className="text-xs text-ivory/50">Admin</p>
        </div>

        <AdminNav />

        <div className="mt-auto border-t border-navy-700 pt-4">
          <p className="mb-2 truncate px-2 text-xs text-ivory/50">{session?.user?.email}</p>
          <form
            action={async () => {
              'use server'
              await signOut({ redirectTo: '/admin/login' })
            }}
          >
            <button
              className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ivory/70 transition hover:bg-navy-800 hover:text-gold-300"
              type="submit"
            >
              Log out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-ivory text-navy-900">{children}</main>
    </div>
  )
}
