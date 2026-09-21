import { formatMoney } from '../utils/dateRanges'
import { debtRemaining, debtsWithDueDates, totalOwedToYouDirect, totalYouOwe } from '../utils/debts'
import { owedByPerson } from '../utils/splits'
import type { Debt, Person, Transaction } from '../types'

interface Props {
  debts: Debt[]
  people: Person[]
  transactions: Transaction[]
  onOpenPeople: () => void
}

export function DebtsWidget({ debts, people, transactions, onOpenPeople }: Props) {
  const personName = (id: string) => people.find((p) => p.id === id)?.name ?? 'Someone'
  const youOweTotals = totalYouOwe(debts)

  const splitOwed = owedByPerson(transactions)
  const directOwedTotals = totalOwedToYouDirect(debts)
  const owedToYouTotals = (() => {
    const map = new Map<string, number>()
    for (const o of splitOwed) {
      for (const t of o.byCurrency) map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount)
    }
    for (const t of directOwedTotals) map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount)
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }))
  })()

  const dueSoon = debtsWithDueDates(debts, 14).slice(0, 5)

  if (youOweTotals.length === 0 && owedToYouTotals.length === 0) return null

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-soft">Friends &amp; debts</h2>
        <button onClick={onOpenPeople} className="text-xs font-medium text-emerald-500 hover:text-emerald-400">
          View all →
        </button>
      </div>

      <div className="mb-1 grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-[11px] text-ink-faint">You owe</p>
          <p className="text-lg font-semibold text-red-400">
            {youOweTotals.length > 0 ? youOweTotals.map((t) => formatMoney(t.amount, t.currency)).join(' · ') : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-ink-faint">Owed to you</p>
          <p className="text-lg font-semibold text-emerald-500">
            {owedToYouTotals.length > 0
              ? owedToYouTotals.map((t) => formatMoney(t.amount, t.currency)).join(' · ')
              : '—'}
          </p>
        </div>
      </div>

      {dueSoon.length > 0 && (
        <ul className="divide-y divide-line border-t border-line pt-2">
          {dueSoon.map(({ debt, daysUntil, overdue }) => (
            <li key={debt.id} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span className="min-w-0 truncate text-ink-soft">{personName(debt.personId)}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="font-medium text-ink">{formatMoney(debtRemaining(debt), debt.currency)}</span>
                <span className={`text-[11px] font-medium ${overdue ? 'text-red-400' : 'text-amber-500'}`}>
                  {overdue ? `Overdue ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Due today' : `In ${daysUntil}d`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
