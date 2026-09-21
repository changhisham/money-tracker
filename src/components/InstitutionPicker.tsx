import { useMemo, useState } from 'react'
import { INSTITUTION_CATEGORY_LABELS, MALAYSIA_INSTITUTIONS, type InstitutionCategory } from '../utils/institutions'
import { InstitutionBadge } from './InstitutionBadge'

const ALL_CATEGORIES: InstitutionCategory[] = ['bank', 'digitalBank', 'ewallet', 'bnpl', 'card']

interface Props {
  categories?: InstitutionCategory[]
  onSelect: (id: string | null) => void
  onClose: () => void
}

export function InstitutionPicker({ categories, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')
  const activeCategories = categories ?? ALL_CATEGORIES

  const groups = useMemo(() => {
    const term = search.trim().toLowerCase()
    return activeCategories.map((category) => ({
      category,
      items: MALAYSIA_INSTITUTIONS.filter(
        (i) => i.category === category && (!term || i.name.toLowerCase().includes(term)),
      ),
    })).filter((g) => g.items.length > 0)
  }, [search, activeCategories])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-2xl border border-line bg-surface sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Choose a bank or wallet logo</h2>
            <button onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
              ✕
            </button>
          </div>
          <input
            autoFocus
            type="text"
            placeholder="Search Maybank, GrabPay, Visa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-line bg-base px-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
          />
        </div>

        <div className="overflow-y-auto p-4">
          <button
            onClick={() => onSelect(null)}
            className="mb-3 flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-ink-soft hover:bg-surface-hover"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-hover text-ink-faint">
              ✕
            </span>
            No specific logo
          </button>

          {groups.length === 0 && <p className="py-6 text-center text-sm text-ink-faint">No matches.</p>}

          {groups.map((group) => (
            <div key={group.category} className="mb-4">
              <h3 className="mb-1.5 px-2 text-xs font-medium uppercase tracking-wide text-ink-faint">
                {INSTITUTION_CATEGORY_LABELS[group.category]}
              </h3>
              <ul>
                {group.items.map((inst) => (
                  <li key={inst.id}>
                    <button
                      onClick={() => onSelect(inst.id)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm text-ink hover:bg-surface-hover"
                    >
                      <InstitutionBadge institution={inst} />
                      {inst.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
