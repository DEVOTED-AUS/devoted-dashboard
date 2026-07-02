'use server'

import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

function expectedToken(password: string): string {
  return createHash('sha256').update(`devoted:${password}`).digest('hex')
}

export async function login(formData: FormData) {
  const submitted = formData.get('password') as string
  const correct = process.env.DASHBOARD_PASSWORD

  if (!correct || submitted !== correct) {
    redirect('/login?error=1')
  }

  const cookieStore = await cookies()
  cookieStore.set('auth_session', expectedToken(correct), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  const next = formData.get('next') as string | null
  redirect(next && next.startsWith('/') ? next : '/')
}
