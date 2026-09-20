import { format } from 'date-fns'
import { formatMoney } from '../utils/dateRanges'
import { categoryIcon } from '../utils/categoryIcons'
import type { UpcomingOccurrence } from '../utils/recurring'
import type { Account } from '../types'

interface Props {
  occurrences: UpcomingOccurrence[]
  accounts: Account[]
  onLogNow: (occurrence: UpcomingOccurrence) => void
}

function dueLabel(daysUntil: number): string {
  if (daysUntil < 0) return 'Overdue'
  if (daysUntil === 0) return 'Due today'
  if (daysUntil === 1) return 'Due tomorrow'
  return `In ${daysUntil} days`
}

export function UpNext({ occurrences, accounts, onLogNow }: Props) {
  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-medium text-ink-soft">Up next</h2>
      <p className="mb-3 text-xs text-ink-faint">Recurring transactions, soonest first.</p>

      {occurrences.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-faint">Nothing recurring due soon.</p>
      ) : (
        <ul className="divide-y divide-line">
          {occurrences.map((o) => {
            const account = accounts.find((a) => a.id === o.latest.accountId)
            return (
              <li key={o.latest.recurringGroupId} className="flex items-center gap-3 py-2.5">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm"
                  aria-hidden
                >
                  {o.latest.type === 'transfer' ? '↔️' : categoryIcon(o.latest.category ?? '')}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-ink">
                      {o.latest.category ?? (o.latest.note || 'Transfer')}
                    </p>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatMoney(o.latest.amount, o.latest.currency)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs text-ink-faint">
                      {account?.name ?? 'Unknown'} · {format(o.dueDate, 'd MMM')}
                    </p>
                    <span className={`shrink-0 text-[11px] font-medium ${o.overdue ? 'text-red-400' : 'text-ink-faint'}`}>
                      {dueLabel(o.daysUntil)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onLogNow(o)}
                  className="shrink-0 rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-surface-hover"
                >
                  Log now
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
