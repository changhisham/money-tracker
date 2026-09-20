import { useEffect, useState, type KeyboardEvent } from 'react'
import { equalShares, yourShare } from '../utils/splits'
import { formatMoney } from '../utils/dateRanges'
import type { Person, SplitShare } from '../types'

type Mode = 'equal' | 'custom'

interface Props {
  amount: number
  currency: string
  people: Person[]
  value: SplitShare[]
  onChange: (splitWith: SplitShare[]) => void
  onAddPerson: (name: string) => Promise<string>
}

export function SplitBillFields({ amount, currency, people, value, onChange, onAddPerson }: Props) {
  const [mode, setMode] = useState<Mode>('equal')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  const selectedIds = value.map((s) => s.personId)

  useEffect(() => {
    if (mode !== 'equal' || value.length === 0) return
    const shares = equalShares(amount, value.length)
    onChange(value.map((s, i) => ({ ...s, amount: shares[i] ?? 0 })))
    // Re-run only when the inputs that determine an equal split change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, amount, value.length])

  function toggle(personId: string) {
    if (selectedIds.includes(personId)) {
      onChange(value.filter((s) => s.personId !== personId))
    } else {
      onChange([...value, { personId, amount: 0, settled: false }])
    }
  }

  function setCustomAmount(personId: string, amountStr: string) {
    const parsed = Number(amountStr) || 0
    onChange(value.map((s) => (s.personId === personId ? { ...s, amount: parsed } : s)))
  }

  async function handleAddPerson() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const id = await onAddPerson(trimmed)
      onChange([...value, { personId: id, amount: 0, settled: false }])
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  const share = yourShare(amount, value)

  return (
    <div className="space-y-3 rounded-xl border border-line bg-base p-3">
      <div className="flex rounded-xl bg-surface p-1">
        {(['equal', 'custom'] as Mode[]).map((m) => (
          <button
            type="button"
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
              m === mode ? 'bg-emerald-500 text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {m === 'equal' ? 'Split equally' : 'Custom amounts'}
          </button>
        ))}
      </div>

      {people.length === 0 && (
        <p className="text-xs text-ink-faint">Add a person below to start splitting this bill.</p>
      )}

      <ul className="space-y-1.5">
        {people.map((p) => {
          const entry = value.find((s) => s.personId === p.id)
          const checked = Boolean(entry)
          return (
            <li key={p.id} className="flex items-center justify-between gap-2">
              <label className="flex flex-1 items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.id)}
                  className="h-4 w-4 rounded border-line accent-emerald-500"
                />
                {p.name}
              </label>
              {checked && mode === 'custom' && (
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={entry?.amount || ''}
                  onChange={(e) => setCustomAmount(p.id, e.target.value)}
                  placeholder="0.00"
                  className="w-24 rounded-lg border border-line bg-surface px-2 py-1 text-right text-sm text-ink outline-none focus:border-emerald-500"
                />
              )}
              {checked && mode === 'equal' && (
                <span className="text-sm text-ink-faint">{formatMoney(entry?.amount ?? 0, currency)}</span>
              )}
            </li>
          )
        })}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a person"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleAddPerson()
            }
          }}
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
        />
        <button
          type="button"
          onClick={handleAddPerson}
          disabled={adding || !newName.trim()}
          className="shrink-0 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      {value.length > 0 && (
        <p className="text-xs text-ink-faint">
          Your share: <span className="font-medium text-ink">{formatMoney(share, currency)}</span>
        </p>
      )}
    </div>
  )
}
