import { NextResponse } from 'next/server'

import { withMobileAuth } from '@/lib/api/mobile'
import { getDashboardStats } from '@/server/admin/crm'

export const GET = withMobileAuth(async () => NextResponse.json(await getDashboardStats()))
