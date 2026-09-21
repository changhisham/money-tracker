import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { firebaseConfigured } from '../firebase'

const HIGHLIGHTS = [
  { dot: 'bg-red-500', title: 'Phone bill', subtitle: 'Due in 3 days', pill: 'Due', pillClass: 'bg-red-100 text-red-600' },
  {
    dot: 'bg-income',
    title: 'Budget usage',
    subtitle: '47% of RM500 spent',
    pill: 'On track',
    pillClass: 'bg-income/15 text-income',
  },
  {
    dot: 'bg-amber-500',
    title: 'Split with Ali',
    subtitle: 'RM30 owed to you',
    pill: 'Pending',
    pillClass: 'bg-amber-100 text-amber-700',
  },
]

export function LoginScreen() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn')
  const [resetting, setResetting] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signIn') {
        await signIn(email, password)
      } else {
        await signUp(email, password)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  async function handleReset(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await resetPassword(email)
      setResetSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  if (!firebaseConfigured) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base p-6 text-ink">
        <div className="max-w-sm rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm leading-relaxed">
          <p className="mb-2 font-semibold text-amber-400">Firebase not configured</p>
          <p>
            Copy <code className="rounded bg-black/30 px-1">.env.example</code> to{' '}
            <code className="rounded bg-black/30 px-1">.env</code> and fill in your Firebase
            project credentials, then restart the dev server. See the README for step-by-step
            instructions.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-base p-4 sm:p-6">
      <div className="grid w-full max-w-4xl animate-fade-in overflow-hidden rounded-3xl border border-line bg-surface shadow-xl lg:grid-cols-2">
        {/* Form panel */}
        <div className="flex flex-col justify-center p-8 sm:p-10">
          <div className="mb-8 flex items-center gap-2.5">
            <img src="/logo-mark.png" alt="" className="h-10 w-10 rounded-xl" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-ink">Money Tracker</p>
              <p className="text-xs text-ink-faint">Keep every ringgit in check</p>
            </div>
          </div>

          {resetting ? (
            <>
              <h1 className="text-2xl font-semibold text-ink">Reset password</h1>
              <p className="mt-1 mb-6 text-sm text-ink-faint">
                {resetSent
                  ? "Check your inbox for a link to reset your password."
                  : "Enter your email and we'll send you a reset link."}
              </p>

              {resetSent ? (
                <button
                  onClick={() => {
                    setResetting(false)
                    setResetSent(false)
                  }}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary-hover"
                >
                  Back to sign in
                </button>
              ) : (
                <form onSubmit={handleReset} className="space-y-3">
                  <input
                    type="email"
                    required
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-base px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-primary"
                  />
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                  >
                    {busy ? 'Sending…' : 'Send reset link'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setResetting(false)
                      setError(null)
                    }}
                    className="w-full text-center text-sm text-ink-faint hover:text-ink"
                  >
                    Back to sign in
                  </button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-ink">
                {mode === 'signIn' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="mt-1 mb-6 text-sm text-ink-faint">
                {mode === 'signIn'
                  ? 'Sign in to sync your money across devices.'
                  : 'Start tracking income, expenses and budgets.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-line bg-base px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-xs font-medium text-ink-soft">Password</label>
                    {mode === 'signIn' && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetting(true)
                          setError(null)
                        }}
                        className="text-xs font-medium text-primary hover:text-primary-hover"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-line bg-base px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-primary"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : 'Sign up'}
                </button>
              </form>

              <button
                onClick={() => {
                  setMode(mode === 'signIn' ? 'signUp' : 'signIn')
                  setError(null)
                }}
                className="mt-5 border-t border-line pt-5 text-center text-sm text-ink-faint hover:text-ink"
              >
                {mode === 'signIn' ? "Don't have an account? " : 'Already have an account? '}
                <span className="font-medium text-primary">
                  {mode === 'signIn' ? 'Create one' : 'Sign in'}
                </span>
              </button>
            </>
          )}
        </div>

        {/* Marketing panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary-strong via-primary to-indigo-900 p-8 text-white lg:flex">
          <div className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative space-y-3">
            {HIGHLIGHTS.map((h, i) => (
              <div
                key={h.title}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/95 p-3.5 text-slate-900 shadow-lg"
                style={{ marginLeft: i === 1 ? '1.5rem' : 0, marginRight: i === 1 ? 0 : '1.5rem' }}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${h.dot}`} aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{h.title}</p>
                    <p className="text-xs text-slate-500">{h.subtitle}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${h.pillClass}`}>
                  {h.pill}
                </span>
              </div>
            ))}
          </div>

          <p className="relative text-xl font-semibold leading-snug">
            Track every ringgit across accounts, budgets and shared bills — all in one place.
          </p>
        </div>
      </div>
    </div>
  )
}
