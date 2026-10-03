import { Prisma, PrismaClient } from '../../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

export { Prisma }

// Standard Next.js dev-mode singleton — without this, hot-reload would create
// a fresh PrismaClient (and connection pool) on every file save.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Without this check, a missing DATABASE_URL makes pg silently fall back to
// localhost:5432 and every query fails with an opaque ECONNREFUSED.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and add your Neon connection string.')
}

// Prisma 7 requires an explicit driver adapter for standard Postgres connections.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
