import { useMemo, useState } from 'react'
import { PeriodSelector } from '../components/PeriodSelector'
import { CategoryChart } from '../components/CategoryChart'
import { SpendingTrend } from '../components/SpendingTrend'
import { getRange, shiftAnchor, formatMoney } from '../utils/dateRanges'
import { inRange, incomeExpenseByCurrency } from '../utils/summary'
import type { Account, Budget, Period, Transaction } from '../types'

interface Props {
  transactions: Transaction[]
  accounts: Account[]
  budgets: Budget[]
}

export function Analytics({ transactions, accounts, budgets }: Props) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [anchor, setAnchor] = useState(new Date())

  const includedTransactions = useMemo(() => transactions.filter((t) => !t.excluded), [transactions])
  const range = useMemo(() => getRange(period, anchor), [period, anchor])
  const isCurrent = useMemo(() => getRange(period, new Date()).label === range.label, [period, range])
  const periodTransactions = useMemo(() => inRange(includedTransactions, range), [includedTransactions, range])
  const totals = useMemo(() => incomeExpenseByCurrency(periodTransactions), [periodTransactions])
  const primary = totals[0]
  const allCurrencies = useMemo(() => [...new Set(accounts.map((a) => a.currency))], [accounts])

  const savings = primary ? primary.income - primary.expense : 0
  const savingsRate = primary && primary.income > 0 ? (savings / primary.income) * 100 : null

  function changePeriod(p: Period) {
    setPeriod(p)
    setAnchor(new Date())
  }

  return (
    <div className="space-y-4 pb-4">
      <PeriodSelector
        period={period}
        onPeriodChange={changePeriod}
        rangeLabel={range.label}
        onPrev={() => setAnchor((a) => shiftAnchor(period, a, -1))}
        onNext={() => setAnchor((a) => shiftAnchor(period, a, 1))}
        onToday={() => setAnchor(new Date())}
        isCurrent={isCurrent}
      />

      {primary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center">
            <p className="text-xs text-ink-faint">Income</p>
            <p className="mt-1 text-lg font-semibold text-income">{formatMoney(primary.income, primary.currency)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center">
            <p className="text-xs text-ink-faint">Expenses</p>
            <p className="mt-1 text-lg font-semibold text-ink">{formatMoney(primary.expense, primary.currency)}</p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center">
            <p className="text-xs text-ink-faint">Savings</p>
            <p className={`mt-1 text-lg font-semibold ${savings >= 0 ? 'text-income' : 'text-danger'}`}>
              {formatMoney(savings, primary.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-3.5 text-center">
            <p className="text-xs text-ink-faint">Savings rate</p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {savingsRate === null ? '—' : `${savingsRate.toFixed(0)}%`}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
          No transactions recorded for this period yet.
        </p>
      )}

      <SpendingTrend transactions={includedTransactions} period={period} anchor={anchor} currencies={allCurrencies} />

      <CategoryChart
        transactions={periodTransactions}
        currencyTotals={totals.map((t) => ({ currency: t.currency, total: t.expense }))}
        budgets={budgets}
        period={period}
      />
    </div>
  )
}
