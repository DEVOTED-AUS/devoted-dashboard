import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getXeroAuthUrl } from '@/lib/xero/client'

export async function GET() {
  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set('xero_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })
  return NextResponse.redirect(getXeroAuthUrl(state))
}
