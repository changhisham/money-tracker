import { Cell, Pie, PieChart } from 'recharts'
import { formatMoney } from '../utils/dateRanges'

interface Props {
  spent: number
  budgetAmount: number | null
  currency: string
  overBudgetCount: number
  budgetsSetCount: number
}

export function BudgetRing({ spent, budgetAmount, currency, overBudgetCount, budgetsSetCount }: Props) {
  const pct = budgetAmount && budgetAmount > 0 ? Math.min((spent / budgetAmount) * 100, 100) : 0
  const over = budgetAmount !== null && spent > budgetAmount
  const ringColor = over ? '#ef4444' : pct >= 80 ? '#f59e0b' : '#10b981'
  const data = [
    { name: 'used', value: pct },
    { name: 'rest', value: 100 - pct },
  ]

  return (
    <div className="animate-fade-in rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-medium text-ink-soft">Budget usage</h2>
      <p className="text-xs text-ink-faint">Share of this period's expense budget spent so far.</p>

      <div className="mt-4 flex items-center gap-5">
        <div className="relative h-28 w-28 shrink-0">
          <PieChart width={112} height={112}>
            <Pie
              data={data}
              dataKey="value"
              cx={56}
              cy={56}
              innerRadius={38}
              outerRadius={54}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive
            >
              <Cell fill={ringColor} />
              <Cell fill="var(--color-surface-hover)" />
            </Pie>
          </PieChart>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-ink">
              {budgetAmount ? `${pct.toFixed(0)}%` : '—'}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <p className="text-xl font-semibold text-ink">{formatMoney(spent, currency)}</p>
          <p className="text-xs text-ink-faint">
            {budgetAmount ? `of ${formatMoney(budgetAmount, currency)} budget` : 'No expense budget set'}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
        <div>
          <p className="text-sm font-semibold text-ink">
            {budgetAmount ? formatMoney(Math.max(budgetAmount - spent, 0), currency) : '—'}
          </p>
          <p className="text-[11px] text-ink-faint">Remaining</p>
        </div>
        <div>
          <p className={`text-sm font-semibold ${overBudgetCount > 0 ? 'text-red-400' : 'text-ink'}`}>
            {overBudgetCount}
          </p>
          <p className="text-[11px] text-ink-faint">Over budget</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{budgetsSetCount}</p>
          <p className="text-[11px] text-ink-faint">Budgets set</p>
        </div>
      </div>
    </div>
  )
}
