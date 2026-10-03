'use client'

import { useActionState } from 'react'

import { loginAction } from './actions'

export function LoginForm() {
  const [error, formAction, isPending] = useActionState(loginAction, undefined)

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ivory/80" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-ivory placeholder:text-ivory/40 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          id="email"
          name="email"
          required
          type="email"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-ivory/80" htmlFor="password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="w-full rounded-lg border border-navy-600 bg-navy-900 px-4 py-2.5 text-ivory placeholder:text-ivory/40 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500"
          id="password"
          name="password"
          required
          type="password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        className="w-full rounded-lg bg-gold-500 px-4 py-2.5 font-semibold text-navy-950 transition hover:bg-gold-300 disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}
