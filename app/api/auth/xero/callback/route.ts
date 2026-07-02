import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCode, getXeroTenants } from '@/lib/xero/client'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/?xero_error=' + error, request.url))
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?xero_error=missing_params', request.url))
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('xero_oauth_state')?.value

  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/?xero_error=state_mismatch', request.url))
  }

  const tokens = await exchangeCode(code)
  const tenants = await getXeroTenants(tokens.access_token)

  if (!tenants.length) {
    return NextResponse.redirect(new URL('/?xero_error=no_tenants', request.url))
  }

  // Use the first tenant (DEVOTED only has one Xero org)
  const tenantId = tenants[0].tenantId
  const expiresAt = Date.now() + tokens.expires_in * 1000

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 60, // 60 days (matches Xero refresh token lifetime)
  }

  cookieStore.set('xero_access_token', tokens.access_token, { ...cookieOpts, maxAge: tokens.expires_in })
  cookieStore.set('xero_refresh_token', tokens.refresh_token, cookieOpts)
  cookieStore.set('xero_tenant_id', tenantId, cookieOpts)
  cookieStore.set('xero_expires_at', String(expiresAt), cookieOpts)
  cookieStore.delete('xero_oauth_state')

  return NextResponse.redirect(new URL('/?xero_connected=1', request.url))
}
