import { login } from '@/app/actions/auth'

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm space-y-8 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">DEVOTED</h1>
          <p className="mt-2 text-sm text-zinc-400">P&amp;L Dashboard</p>
        </div>

        <LoginForm searchParams={searchParams} />
      </div>
    </div>
  )
}

async function LoginForm({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>
}) {
  const params = await searchParams
  const hasError = params.error === '1'
  const next = params.next ?? '/'

  return (
    <form action={login} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
          className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-1 focus:ring-white"
          placeholder="Enter password"
        />
      </div>

      {hasError && (
        <p className="text-sm text-red-400">Incorrect password. Try again.</p>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-colors"
      >
        Sign in
      </button>
    </form>
  )
}
