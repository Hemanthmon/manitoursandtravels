import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import authConfig from './auth.config'
import { verifyAdminCredentials } from './lib/auth/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await verifyAdminCredentials(credentials?.email, credentials?.password)
        if (!user) return null

        return { id: String(user.id), email: user.email, name: user.name }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (session.user && typeof token.id === 'string') session.user.id = token.id
      return session
    },
  },
})
