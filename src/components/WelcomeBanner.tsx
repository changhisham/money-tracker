interface Props {
  name: string
  email: string | null
  subtitle: string
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function WelcomeBanner({ name, email, subtitle }: Props) {
  return (
    <div className="animate-fade-in relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-5 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-14 right-16 h-28 w-28 rounded-full bg-white/5" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-indigo-200">{greeting()}</p>
          <p className="mt-1 truncate text-lg font-semibold">Welcome back, {name}</p>
          <p className="mt-1.5 text-sm text-indigo-200">{subtitle}</p>
        </div>
        <div className="hidden shrink-0 items-center gap-2.5 rounded-xl bg-white/10 px-3 py-2 sm:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-[11px] text-indigo-200">{email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
