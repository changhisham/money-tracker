import { useState } from 'react'
import { Home, Plus, MoreHorizontal, type LucideIcon } from 'lucide-react'
import { NAV_ITEMS, MORE_ITEMS, type Tab } from './navItems'
import { BottomSheet } from './BottomSheet'

interface Props {
  tab: Tab
  onChange: (tab: Tab) => void
  onAddTransaction: () => void
}

const PRIMARY_ITEMS = NAV_ITEMS.filter((item) => item.mobilePrimary)
const [overviewItem, ...restPrimary] = PRIMARY_ITEMS

export function BottomNav({ tab, onChange, onAddTransaction }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const moreActive = MORE_ITEMS.some((item) => item.id === tab)

  return (
    <>
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-lg items-stretch">
          <NavButton
            label="Home"
            icon={Home}
            active={tab === overviewItem.id}
            onClick={() => onChange(overviewItem.id)}
          />
          {restPrimary.slice(0, 1).map((item) => (
            <NavButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={tab === item.id}
              onClick={() => onChange(item.id)}
            />
          ))}

          <div className="flex flex-1 items-center justify-center">
            <button
              onClick={onAddTransaction}
              aria-label="Add transaction"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover active:scale-95"
            >
              <Plus className="h-6 w-6" aria-hidden />
            </button>
          </div>

          {restPrimary.slice(1).map((item) => (
            <NavButton
              key={item.id}
              label={item.label}
              icon={item.icon}
              active={tab === item.id}
              onClick={() => onChange(item.id)}
            />
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
              moreActive ? 'text-primary' : 'text-ink-faint'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden />
            More
          </button>
        </div>
      </nav>

      {moreOpen && (
        <BottomSheet title="More" onClose={() => setMoreOpen(false)}>
          <div className="space-y-1">
            {MORE_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id)
                    setMoreOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    tab === item.id ? 'bg-surface-hover text-ink' : 'text-ink-soft hover:bg-surface-hover'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </button>
              )
            })}
          </div>
        </BottomSheet>
      )}
    </>
  )
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition ${
        active ? 'text-primary' : 'text-ink-faint'
      }`}
    >
      <Icon className="h-5 w-5" aria-hidden />
      {label}
    </button>
  )
}
