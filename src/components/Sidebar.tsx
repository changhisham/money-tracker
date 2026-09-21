import { LogOut, Plus } from 'lucide-react'
import { NAV_ITEMS, SECTION_LABELS, SETTINGS_ITEM, type NavSection, type Tab } from './navItems'
import { APP_VERSION } from '../types'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
  onAddTransaction: () => void
  name: string
  email: string | null
  onSignOut: () => void
}

const SECTIONS: NavSection[] = ['overview', 'money']

export function Sidebar({ tab, onChange, onAddTransaction, name, email, onSignOut }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-indigo-950 md:flex">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <img src="/logo-mark.png" alt="" className="h-9 w-9 rounded-xl" />
        <div>
          <p className="text-sm font-semibold text-white">Money Tracker</p>
          <p className="text-[11px] text-indigo-300">Personal finance</p>
        </div>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={onAddTransaction}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-hover"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add transaction
        </button>
      </div>

      <nav aria-label="Main navigation" className="flex-1 space-y-4 overflow-y-auto px-3 pt-2">
        {SECTIONS.map((section) => (
          <div key={section}>
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
              {SECTION_LABELS[section]}
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.filter((item) => item.section === section).map((item) => {
                const active = item.id === tab
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => onChange(item.id)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl border-l-2 px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? 'border-primary-hover bg-indigo-900 text-white'
                        : 'border-transparent text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-indigo-900 px-3 py-3">
        <button
          onClick={() => onChange(SETTINGS_ITEM.id)}
          aria-current={tab === SETTINGS_ITEM.id ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
            tab === SETTINGS_ITEM.id
              ? 'bg-indigo-900 text-white'
              : 'text-indigo-300 hover:bg-indigo-900/60 hover:text-white'
          }`}
        >
          <SETTINGS_ITEM.icon className="h-4 w-4 shrink-0" aria-hidden />
          {SETTINGS_ITEM.label}
        </button>
      </div>

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
            <LogOut className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-2 px-2 text-[10px] text-indigo-400">
          v{APP_VERSION} · © {new Date().getFullYear()} Money Tracker
        </p>
      </div>
    </aside>
  )
}
