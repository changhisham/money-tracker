import { useState, type FormEvent } from 'react'
import { formatMoney } from '../utils/dateRanges'
import { owedByPerson, transactionsInvolvingPerson } from '../utils/splits'
import { ConfirmDialog } from '../components/ConfirmDialog'
import type { Person, Transaction } from '../types'

interface Props {
  people: Person[]
  transactions: Transaction[]
  onAddPerson: (name: string) => Promise<string>
  onDeletePerson: (id: string) => Promise<void>
  onToggleSettled: (transaction: Transaction, personId: string) => Promise<void>
}

export function People({ people, transactions, onAddPerson, onDeletePerson, onToggleSettled }: Props) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null)

  const owed = owedByPerson(transactions)

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      await onAddPerson(trimmed)
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex gap-2 rounded-2xl border border-line bg-surface p-3">
        <input
          type="text"
          placeholder="Add a person"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="shrink-0 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {people.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
          Add people you split bills with to track who owes you.
        </p>
      ) : (
        <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => {
            const totals = owed.find((o) => o.personId === person.id)?.byCurrency ?? []
            const isExpanded = expanded === person.id
            const involved = transactionsInvolvingPerson(transactions, person.id)

            return (
              <div key={person.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => setExpanded(isExpanded ? null : person.id)}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-medium text-ink-soft">
                      {person.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{person.name}</p>
                      <p className="text-xs text-ink-faint">
                        {totals.length === 0
                          ? 'All settled up'
                          : totals.map((t) => `owes ${formatMoney(t.amount, t.currency)}`).join(' · ')}
                      </p>
                    </span>
                  </button>
                  <button
                    onClick={() => setPendingDelete(person)}
                    aria-label={`Remove ${person.name}`}
                    className="shrink-0 text-ink-faint hover:text-red-400"
                  >
                    🗑
                  </button>
                </div>

                {isExpanded && (
                  <ul className="mt-3 space-y-2 border-t border-line pt-3">
                    {involved.length === 0 && (
                      <p className="text-xs text-ink-faint">No shared expenses yet.</p>
                    )}
                    {involved.map((t) => {
                      const share = t.splitWith!.find((s) => s.personId === person.id)!
                      return (
                        <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="min-w-0 truncate text-ink-soft">
                            {t.category} · {t.note || t.date}
                          </span>
                          <button
                            onClick={() => onToggleSettled(t, person.id)}
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${
                              share.settled
                                ? 'bg-emerald-500/10 text-emerald-500'
                                : 'bg-surface-hover text-ink-soft hover:text-ink'
                            }`}
                          >
                            {formatMoney(share.amount, t.currency)} {share.settled ? '· Settled ✓' : '· Mark settled'}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Remove ${pendingDelete.name}?`}
          message="This removes them from your people list. Past split records stay on their transactions."
          confirmLabel="Remove"
          onConfirm={() => {
            onDeletePerson(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
