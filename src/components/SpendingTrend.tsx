import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { recentPeriods, formatMoney } from '../utils/dateRanges'
import { inRange, totalsByCurrency } from '../utils/summary'
import type { Transaction, Period } from '../types'

const TREND_LENGTH = 6

const SHORT_LABEL: Record<Period, (label: string) => string> = {
  weekly: (label) => label.split(' – ')[0],
  monthly: (label) => label.split(' ')[0].slice(0, 3),
  yearly: (label) => label,
}

interface Props {
  transactions: Transaction[]
  period: Period
  anchor: Date
  currencies: string[]
}

export function SpendingTrend({ transactions, period, anchor, currencies }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const currency = selected && currencies.includes(selected) ? selected : currencies[0]

  const data = useMemo(() => {
    if (!currency) return []
    return recentPeriods(period, anchor, TREND_LENGTH).map((point) => {
      const bucket = inRange(transactions, point.range)
      const income = totalsByCurrency(bucket, 'income').find((t) => t.currency === currency)?.total ?? 0
      const expense = totalsByCurrency(bucket, 'expense').find((t) => t.currency === currency)?.total ?? 0
      return { label: SHORT_LABEL[period](point.range.label), income, expense }
    })
  }, [transactions, period, anchor, currency])

  if (!currency || data.every((d) => d.income === 0 && d.expense === 0)) return null

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-soft">Income vs expense</h2>
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

      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--color-ink-faint)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              cursor={{ fill: 'var(--color-surface-hover)' }}
              contentStyle={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-line)',
                borderRadius: 8,
                fontSize: 12,
                color: 'var(--color-ink)',
              }}
              formatter={(value, name) => [formatMoney(Number(value ?? 0), currency), name === 'income' ? 'Income' : 'Expense']}
              labelFormatter={() => ''}
            />
            <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={16} />
            <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
