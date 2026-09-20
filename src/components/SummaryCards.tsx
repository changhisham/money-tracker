import { formatMoney } from '../utils/dateRanges'
import type { IncomeExpenseTotal } from '../utils/summary'
import type { Budget, Period } from '../types'

interface Props {
  totals: IncomeExpenseTotal[]
  budgets: Budget[]
  period: Period
}

export function SummaryCards({ totals, budgets, period }: Props) {
  if (totals.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
        No transactions recorded for this period yet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {totals.map(({ currency, income, expense }, i) => {
        const net = income - expense
        const budget = budgets.find((b) => b.period === period && b.currency === currency && !b.category)
        const pct = budget && budget.amount > 0 ? Math.min((expense / budget.amount) * 100, 999) : null
        const over = pct !== null && pct >= 100
        const near = pct !== null && pct >= 80 && pct < 100

        return (
          <div
            key={currency}
            className="animate-fade-in rounded-2xl border border-line bg-surface p-4"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-faint">{currency}</span>
              <span className={`text-xs font-medium ${net >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                Net {net >= 0 ? '+' : ''}
                {formatMoney(net, currency)}
              </span>
            </div>

            <div className="mt-2 flex items-center gap-4 text-sm">
              <span className="text-ink-soft">
                <span className="text-emerald-500">▲</span> {formatMoney(income, currency)}
              </span>
              <span className="text-ink-soft">
                <span className="text-red-400">▼</span> {formatMoney(expense, currency)}
              </span>
            </div>

            {budget && (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-all ${
                      over ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(pct ?? 0, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-ink-faint">
                  {pct?.toFixed(0)}% of {formatMoney(budget.amount, currency)} expense budget
                  {over && <span className="ml-1 text-red-400">— over budget</span>}
                  {near && <span className="ml-1 text-amber-400">— almost there</span>}
                </p>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
