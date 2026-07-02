import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchXeroExpenses, refreshAccessToken } from '@/lib/xero/client'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const start = searchParams.get('start')
  const end = searchParams.get('end')

  if (!start || !end) {
    return NextResponse.json({ error: 'start and end query params required' }, { status: 400 })
  }

  const cookieStore = await cookies()
  let accessToken = cookieStore.get('xero_access_token')?.value
  const refreshToken = cookieStore.get('xero_refresh_token')?.value
  const tenantId = cookieStore.get('xero_tenant_id')?.value
  const expiresAt = parseInt(cookieStore.get('xero_expires_at')?.value ?? '0')

  if (!refreshToken || !tenantId) {
    return NextResponse.json(
      { error: 'Xero not connected', connected: false },
      { status: 401 }
    )
  }

  // Refresh access token if expired or missing (with 60s buffer)
  if (!accessToken || Date.now() > expiresAt - 60_000) {
    const newTokens = await refreshAccessToken(refreshToken)
    accessToken = newTokens.access_token
    const newExpiry = Date.now() + newTokens.expires_in * 1000

    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    }
    cookieStore.set('xero_access_token', accessToken, {
      ...cookieOpts,
      maxAge: newTokens.expires_in,
    })
    cookieStore.set('xero_refresh_token', newTokens.refresh_token, {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 60,
    })
    cookieStore.set('xero_expires_at', String(newExpiry), {
      ...cookieOpts,
      maxAge: 60 * 60 * 24 * 60,
    })
  }

  const data = await fetchXeroExpenses(accessToken, tenantId, start, end)
  return NextResponse.json({ range: { start, end }, data })
}
