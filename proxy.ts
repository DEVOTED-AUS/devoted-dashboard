import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHash } from 'crypto'

function expectedToken(password: string): string {
  return createHash('sha256').update(`devoted:${password}`).digest('hex')
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow login page and its API action through
  if (pathname.startsWith('/login')) {
    return NextResponse.next()
  }

  const password = process.env.DASHBOARD_PASSWORD
  if (!password) {
    // Misconfigured — block everything
    return new NextResponse('Server misconfigured: DASHBOARD_PASSWORD not set', { status: 500 })
  }

  const sessionCookie = request.cookies.get('auth_session')?.value
  if (sessionCookie && sessionCookie === expectedToken(password)) {
    return NextResponse.next()
  }

  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
