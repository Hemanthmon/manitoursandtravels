import type { Metadata } from 'next'

import { LoginForm } from './LoginForm'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-navy-700 bg-navy-900/60 p-8 shadow-2xl">
        <h1 className="mb-1 font-head text-2xl font-bold text-ivory">Mani Tours and Travels</h1>
        <p className="mb-6 text-sm text-ivory/60">Sign in to the admin dashboard.</p>
        <LoginForm />
      </div>
    </div>
  )
}
