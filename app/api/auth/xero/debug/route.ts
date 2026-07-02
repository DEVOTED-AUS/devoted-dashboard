import { NextResponse } from 'next/server'
import { getXeroAuthUrl } from '@/lib/xero/client'

export async function GET() {
  const url = getXeroAuthUrl('test-state')
  const redirectUri = process.env.XERO_REDIRECT_URI ?? 'NOT SET'
  const clientId = process.env.XERO_CLIENT_ID ? process.env.XERO_CLIENT_ID.slice(0, 6) + '...' : 'NOT SET'
  return NextResponse.json({ redirectUri, clientId, fullAuthUrl: url })
}
