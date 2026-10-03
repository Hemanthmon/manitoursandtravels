import 'dotenv/config'
import bcrypt from 'bcryptjs'

import { prisma } from '../src/lib/prisma'

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

async function main() {
  const email = getArg('--email') ?? process.env.ADMIN_EMAIL
  const password = getArg('--password') ?? process.env.ADMIN_PASSWORD
  const name = getArg('--name') ?? process.env.ADMIN_NAME

  if (!email || !password) {
    console.error(
      'Usage: pnpm create-admin -- --email you@example.com --password "a-strong-password" [--name "Your Name"]',
    )
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, name },
    update: { passwordHash, name },
  })

  console.log(`Admin user ready: ${user.email} (id ${user.id})`)
  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(error)
  await prisma.$disconnect()
  process.exit(1)
})
