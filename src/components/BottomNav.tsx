import { NAV_ITEMS, type Tab } from './navItems'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
}

const TABS = NAV_ITEMS.filter((item) => item.mobile)

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-lg">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
              tab === t.id ? 'text-emerald-500' : 'text-ink-faint'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden>
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
