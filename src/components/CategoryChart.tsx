import { useMemo, useState } from 'react'
import { Cell, Pie, PieChart } from 'recharts'
import { formatMoney } from '../utils/dateRanges'
import { totalsByCategory, type CurrencyTotal } from '../utils/summary'
import { categoryColor } from '../utils/categoryColors'
import { categoryIcon } from '../utils/categoryIcons'
import type { Budget, Transaction, Period } from '../types'

interface Props {
  transactions: Transaction[]
  currencyTotals: CurrencyTotal[]
  budgets: Budget[]
  period: Period
}

export function CategoryChart({ transactions, currencyTotals, budgets, period }: Props) {
  const currencies = currencyTotals.map((c) => c.currency)
  const [selected, setSelected] = useState<string | null>(null)
  const currency = selected && currencies.includes(selected) ? selected : currencies[0]

  const rows = useMemo(
    () => (currency ? totalsByCategory(transactions, currency, 'expense') : []),
    [transactions, currency],
  )
  const total = rows.reduce((sum, r) => sum + r.total, 0)

  if (rows.length === 0) return null

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-soft">By category</h2>
        {currencies.length > 1 && (
          <select
            value={currency}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-line bg-base px-2 py-1 text-xs text-ink"
          >
            {currencies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="relative mx-auto mb-4 h-40 w-40">
        <PieChart width={160} height={160}>
          <Pie
            data={rows}
            dataKey="total"
            nameKey="category"
            cx={80}
            cy={80}
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            stroke="none"
            isAnimationActive
          >
            {rows.map((row) => (
              <Cell key={row.category} fill={categoryColor(row.category)} />
            ))}
          </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold text-ink">{formatMoney(total, currency)}</span>
          <span className="text-[11px] text-ink-faint">total</span>
        </div>
      </div>

      <ul className="space-y-3">
        {rows.map((row) => {
          const sharePct = total > 0 ? (row.total / total) * 100 : 0
          const budget = budgets.find(
            (b) => b.period === period && b.currency === currency && b.category === row.category,
          )
          const budgetPct = budget && budget.amount > 0 ? Math.min((row.total / budget.amount) * 100, 999) : null
          const over = budgetPct !== null && budgetPct >= 100

          return (
            <li key={row.category}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-soft">
                  <span aria-hidden>{categoryIcon(row.category)}</span>
                  {row.category}
                  <span className="text-ink-faint">{sharePct.toFixed(0)}%</span>
                </span>
                <span className="font-medium text-ink">{formatMoney(row.total, currency)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(budgetPct ?? sharePct, 100)}%`,
                    backgroundColor: over ? '#ef4444' : categoryColor(row.category),
                  }}
                />
              </div>
              {budget && (
                <p className={`mt-1 text-[11px] ${over ? 'text-red-400' : 'text-ink-faint'}`}>
                  {budgetPct?.toFixed(0)}% of {formatMoney(budget.amount, currency)} budget
                  {over && ' — over'}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
