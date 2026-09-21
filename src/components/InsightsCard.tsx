import { useMemo } from 'react'
import { getRange, shiftAnchor, formatMoney } from '../utils/dateRanges'
import { inRange, totalsByCategory, totalsByCurrency } from '../utils/summary'
import { categoryIcon } from '../utils/categoryIcons'
import type { Period, Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  period: Period
  anchor: Date
  currency: string
}

export function InsightsCard({ transactions, period, anchor, currency }: Props) {
  const insights = useMemo(() => {
    if (!currency) return null

    const currentRange = getRange(period, anchor)
    const currentExpenses = inRange(transactions, currentRange).filter(
      (t) => t.type === 'expense' && t.currency === currency,
    )
    const currentTotal = currentExpenses.reduce((sum, t) => sum + t.amount, 0)
    if (currentTotal === 0) return null

    const prevAnchor = shiftAnchor(period, anchor, -1)
    const prevRange = getRange(period, prevAnchor)
    const prevExpenses = inRange(transactions, prevRange).filter(
      (t) => t.type === 'expense' && t.currency === currency,
    )
    const prevTotal = totalsByCurrency(prevExpenses, 'expense').find((t) => t.currency === currency)?.total ?? 0

    const change = prevTotal > 0 ? ((currentTotal - prevTotal) / prevTotal) * 100 : null

    const topCategory = totalsByCategory(currentExpenses, currency, 'expense')[0]
    const biggest = [...currentExpenses].sort((a, b) => b.amount - a.amount)[0]

    return { change, topCategory, biggest }
  }, [transactions, period, anchor, currency])

  if (!insights) return null
  const { change, topCategory, biggest } = insights

  return (
    <div className="animate-fade-in grid grid-cols-1 gap-2 sm:grid-cols-3">
      {change !== null && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-ink-faint">vs last period</p>
          <p className={`mt-0.5 text-sm font-semibold ${change > 0 ? 'text-red-400' : 'text-income'}`}>
            {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(0)}%
          </p>
        </div>
      )}
      {topCategory && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-ink-faint">Top category</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink">
            {categoryIcon(topCategory.category)} {topCategory.category}
          </p>
        </div>
      )}
      {biggest && (
        <div className="rounded-xl border border-line bg-surface p-3">
          <p className="text-xs text-ink-faint">Biggest expense</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-ink">
            {formatMoney(biggest.amount, biggest.currency)}
          </p>
        </div>
      )}
    </div>
  )
}
