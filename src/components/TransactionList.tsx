import { useMemo, useState } from 'react'
import { formatMoney, relativeDayLabel } from '../utils/dateRanges'
import { categoryColor } from '../utils/categoryColors'
import { categoryIcon } from '../utils/categoryIcons'
import { ConfirmDialog } from './ConfirmDialog'
import type { Account, Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  accounts: Account[]
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
}

interface Group {
  date: string
  label: string
  items: Transaction[]
}

function accountName(accounts: Account[], id: string) {
  return accounts.find((a) => a.id === id)?.name ?? 'Unknown account'
}

export function TransactionList({ transactions, accounts, onDelete, onEdit }: Props) {
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null)

  const groups = useMemo(() => {
    const byDate = new Map<string, Transaction[]>()
    for (const t of transactions) {
      const bucket = byDate.get(t.date)
      if (bucket) bucket.push(t)
      else byDate.set(t.date, [t])
    }
    return [...byDate.entries()].map(
      ([date, items]): Group => ({ date, label: relativeDayLabel(date), items }),
    )
  }, [transactions])

  if (transactions.length === 0) return null

  return (
    <>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.date}>
            <h3 className="mb-1.5 px-1 text-xs font-medium uppercase tracking-wide text-ink-faint">
              {group.label}
            </h3>
            <div className="rounded-2xl border border-line bg-surface p-2">
              <ul className="divide-y divide-line">
                {group.items.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-2 py-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                      style={{
                        backgroundColor:
                          t.type === 'transfer'
                            ? '#3987e526'
                            : `${categoryColor(t.category ?? '')}26`,
                      }}
                      aria-hidden
                    >
                      {t.type === 'transfer' ? '↔️' : categoryIcon(t.category ?? '')}
                    </span>
                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onEdit(t)}
                      aria-label={`Edit ${t.type} transaction`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-ink">
                          {t.type === 'transfer'
                            ? `${accountName(accounts, t.accountId)} → ${accountName(accounts, t.toAccountId ?? '')}`
                            : t.payee || t.category}
                        </p>
                        <p
                          className={`shrink-0 text-sm font-semibold ${
                            t.type === 'income'
                              ? 'text-income'
                              : t.type === 'expense'
                                ? 'text-ink'
                                : 'text-blue-400'
                          }`}
                        >
                          {t.type === 'income' ? '+' : t.type === 'expense' ? '−' : ''}
                          {formatMoney(t.amount, t.currency)}
                        </p>
                      </div>
                      <p className="truncate text-xs text-ink-faint">
                        {t.recurrence && '↻ '}
                        {t.splitWith?.length ? '👥 split · ' : ''}
                        {t.excluded ? '🚫 excluded · ' : ''}
                        {t.payee && t.type !== 'transfer' ? `${t.category} · ` : ''}
                        {t.type !== 'transfer' ? `${accountName(accounts, t.accountId)} · ` : ''}
                        {t.note || ' '}
                      </p>
                      {t.tags && t.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {t.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-medium text-ink-faint"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                    <button
                      onClick={() => setPendingDelete(t)}
                      aria-label={`Delete ${t.type} transaction`}
                      className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:bg-surface-hover hover:text-red-400"
                    >
                      🗑
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete transaction?"
          message={`This will permanently delete the ${formatMoney(pendingDelete.amount, pendingDelete.currency)} entry.`}
          confirmLabel="Delete"
          onConfirm={() => {
            onDelete(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </>
  )
}
