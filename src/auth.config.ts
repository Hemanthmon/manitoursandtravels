import type { NextAuthConfig } from 'next-auth'

// Edge-safe config only: no providers, no bcrypt/Prisma imports here.
// Used directly by middleware (which runs on the Edge runtime) to check
// for a valid session cookie without touching the database. The full
// config (with the Credentials provider) lives in auth.ts and is only
// ever loaded in Node.js contexts (Server Actions, Route Handlers).
export default {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isLoginPage = nextUrl.pathname === '/admin/login'
      const isAdminRoute = nextUrl.pathname.startsWith('/admin')

      if (!isAdminRoute) return true

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL('/admin', nextUrl))
        return true
      }

      return isLoggedIn
    },
  },
  providers: [],
} satisfies NextAuthConfig
