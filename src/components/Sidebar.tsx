import { NAV_ITEMS, type Tab } from './navItems'
import { APP_VERSION } from '../types'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
  name: string
  email: string | null
  onSignOut: () => void
}

export function Sidebar({ tab, onChange, name, email, onSignOut }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-indigo-950 md:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <img src="/logo-mark.png" alt="" className="h-9 w-9 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-white">Money Tracker</p>
          <p className="text-[11px] text-indigo-300">Personal finance</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = item.id === tab
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'border-emerald-400 bg-indigo-900 text-white'
                  : 'border-transparent text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
              }`}
            >
              <span className="text-base" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-indigo-900 px-3 py-4">
        <div className="flex items-center gap-2.5 rounded-xl px-2 py-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-800 text-sm font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{name}</p>
            <p className="truncate text-[11px] text-indigo-300">{email}</p>
          </div>
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            title="Sign out"
            className="shrink-0 rounded-lg p-1.5 text-indigo-300 hover:bg-indigo-900 hover:text-white"
          >
            ⏻
          </button>
        </div>
        <p className="mt-2 px-2 text-[10px] text-indigo-400">
          v{APP_VERSION} · © {new Date().getFullYear()} Money Tracker
        </p>
      </div>
    </aside>
  )
}
