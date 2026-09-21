import { useMemo, useState } from 'react'
import { PeriodSelector } from '../components/PeriodSelector'
import { WelcomeBanner } from '../components/WelcomeBanner'
import { BudgetRing } from '../components/BudgetRing'
import { UpNext } from '../components/UpNext'
import { StatCard } from '../components/StatCard'
import { SummaryCards } from '../components/SummaryCards'
import { CategoryChart } from '../components/CategoryChart'
import { SpendingTrend } from '../components/SpendingTrend'
import { InsightsCard } from '../components/InsightsCard'
import { DebtsWidget } from '../components/DebtsWidget'
import { AccountsOverview } from '../components/AccountsOverview'
import { TransactionList } from '../components/TransactionList'
import { getRange, shiftAnchor } from '../utils/dateRanges'
import { inRange, incomeExpenseByCurrency, periodSeries } from '../utils/summary'
import { computeAccountBalances } from '../utils/accountBalances'
import { upcomingOccurrences } from '../utils/recurring'
import type { Account, Budget, Debt, NewTransaction, Person, Transaction, Period } from '../types'

const SPARK_LENGTH = 6
const RECENT_COUNT = 6

function trendPct(series: number[]): number | null {
  const current = series[series.length - 1] ?? 0
  const previous = series[series.length - 2] ?? 0
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

interface Props {
  transactions: Transaction[]
  accounts: Account[]
  budgets: Budget[]
  people: Person[]
  debts: Debt[]
  name: string
  email: string | null
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
  onAddTransaction: (transaction: NewTransaction) => Promise<unknown>
  onOpenPeople: () => void
  onViewAllTransactions: () => void
  onViewAnalytics: () => void
}

export function Overview({
  transactions,
  accounts,
  budgets,
  people,
  debts,
  name,
  email,
  onDelete,
  onEdit,
  onAddTransaction,
  onOpenPeople,
  onViewAllTransactions,
  onViewAnalytics,
}: Props) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [anchor, setAnchor] = useState(new Date())

  const includedTransactions = useMemo(() => transactions.filter((t) => !t.excluded), [transactions])

  const range = useMemo(() => getRange(period, anchor), [period, anchor])
  const periodTransactions = useMemo(() => inRange(transactions, range), [transactions, range])
  const includedPeriodTransactions = useMemo(
    () => inRange(includedTransactions, range),
    [includedTransactions, range],
  )
  const totals = useMemo(() => incomeExpenseByCurrency(includedPeriodTransactions), [includedPeriodTransactions])
  const primaryCurrency = totals[0]?.currency ?? accounts[0]?.currency ?? ''
  const isCurrent = useMemo(() => getRange(period, new Date()).label === range.label, [period, range])

  const balances = useMemo(() => computeAccountBalances(accounts, transactions), [accounts, transactions])
  const allCurrencies = useMemo(() => [...new Set(accounts.map((a) => a.currency))], [accounts])

  const series = useMemo(
    () => periodSeries(includedTransactions, period, anchor, SPARK_LENGTH, primaryCurrency),
    [includedTransactions, period, anchor, primaryCurrency],
  )
  const incomeSeries = series.map((s) => s.income)
  const expenseSeries = series.map((s) => s.expense)
  const netSeries = series.map((s) => s.income - s.expense)
  const primaryTotal = totals.find((t) => t.currency === primaryCurrency)

  const overallBudget = budgets.find((b) => b.period === period && b.currency === primaryCurrency && !b.category)
  const categoryBudgets = budgets.filter((b) => b.period === period && b.currency === primaryCurrency && b.category)
  const expenseByCategory = useMemo(
    () =>
      includedPeriodTransactions
        .filter((t) => t.type === 'expense' && t.currency === primaryCurrency && t.category)
        .reduce<Record<string, number>>((acc, t) => {
          acc[t.category!] = (acc[t.category!] ?? 0) + t.amount
          return acc
        }, {}),
    [includedPeriodTransactions, primaryCurrency],
  )
  const overBudgetCount = categoryBudgets.filter((b) => (expenseByCategory[b.category!] ?? 0) > b.amount).length

  const upcoming = useMemo(
    () => upcomingOccurrences(transactions, 14).filter((o) => o.latest.currency === primaryCurrency),
    [transactions, primaryCurrency],
  )
  const upcomingTotal = upcoming.reduce((sum, o) => sum + o.latest.amount, 0)

  const recentTransactions = useMemo(() => transactions.slice(0, RECENT_COUNT), [transactions])

  function changePeriod(p: Period) {
    setPeriod(p)
    setAnchor(new Date())
  }

  async function logNow(occurrence: (typeof upcoming)[number]) {
    const { latest } = occurrence
    await onAddTransaction({
      type: latest.type,
      amount: latest.amount,
      currency: latest.currency,
      accountId: latest.accountId,
      toAccountId: latest.toAccountId ?? null,
      category: latest.category ?? null,
      payee: latest.payee ?? null,
      tags: latest.tags ?? null,
      note: latest.note,
      date: occurrence.dueDate.toISOString().slice(0, 10),
      recurrence: latest.recurrence,
      recurringGroupId: latest.recurringGroupId,
      recurrenceEnd: latest.recurrenceEnd ?? null,
      excluded: latest.excluded ?? false,
      splitWith: null,
    })
  }

  return (
    <div className="space-y-5 pb-4">
      <WelcomeBanner
        name={name}
        email={email}
        subtitle={
          upcoming.length > 0
            ? `You have ${upcoming.length} recurring ${upcoming.length === 1 ? 'transaction' : 'transactions'} coming up.`
            : "Here's how things look this period."
        }
      />

      <AccountsOverview balances={balances} />

      <div>
        <div className="mb-3 flex items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-ink">{range.label}</h2>
            <p className="text-xs text-ink-faint">Here's what needs your attention.</p>
          </div>
        </div>
        <PeriodSelector
          period={period}
          onPeriodChange={changePeriod}
          rangeLabel={range.label}
          onPrev={() => setAnchor((a) => shiftAnchor(period, a, -1))}
          onNext={() => setAnchor((a) => shiftAnchor(period, a, 1))}
          onToday={() => setAnchor(new Date())}
          isCurrent={isCurrent}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Income"
          value={primaryTotal ? `+${primaryCurrency} ${primaryTotal.income.toFixed(0)}` : '—'}
          icon="💰"
          iconBg="#10b98126"
          trendPct={trendPct(incomeSeries)}
          goodDirection="up"
          sparkline={incomeSeries}
        />
        <StatCard
          label="Spending"
          value={primaryTotal ? `${primaryCurrency} ${primaryTotal.expense.toFixed(0)}` : '—'}
          icon="💸"
          iconBg="#ef444426"
          trendPct={trendPct(expenseSeries)}
          goodDirection="down"
          sparkline={expenseSeries}
        />
        <StatCard
          label="Saved"
          value={primaryTotal ? `${primaryCurrency} ${(primaryTotal.income - primaryTotal.expense).toFixed(0)}` : '—'}
          icon="📈"
          iconBg="#3987e526"
          trendPct={trendPct(netSeries)}
          goodDirection="up"
          sparkline={netSeries}
        />
        <StatCard
          label="Upcoming (14d)"
          value={upcoming.length > 0 ? `${primaryCurrency} ${upcomingTotal.toFixed(0)}` : '—'}
          icon="🔔"
          iconBg="#c9850026"
          trendPct={null}
          goodDirection="down"
          sparkline={[]}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BudgetRing
          spent={primaryTotal?.expense ?? 0}
          budgetAmount={overallBudget?.amount ?? null}
          currency={primaryCurrency}
          overBudgetCount={overBudgetCount}
          budgetsSetCount={budgets.filter((b) => b.period === period && b.currency === primaryCurrency).length}
        />
        <UpNext occurrences={upcoming} accounts={accounts} onLogNow={logNow} />
      </div>

      <DebtsWidget debts={debts} people={people} transactions={transactions} onOpenPeople={onOpenPeople} />

      <div>
        <CategoryChart
          transactions={includedPeriodTransactions}
          currencyTotals={totals.map((t) => ({ currency: t.currency, total: t.expense }))}
          budgets={budgets}
          period={period}
        />
        <button
          onClick={onViewAnalytics}
          className="mt-2 text-xs font-medium text-primary hover:text-primary-hover"
        >
          View analytics →
        </button>
      </div>

      <SpendingTrend transactions={includedTransactions} period={period} anchor={anchor} currencies={allCurrencies} />
      <InsightsCard transactions={includedTransactions} period={period} anchor={anchor} currency={primaryCurrency} />

      {allCurrencies.length > 1 && <SummaryCards totals={totals} budgets={budgets} period={period} />}

      {periodTransactions.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-ink-soft">Recent transactions</h2>
            <button
              onClick={onViewAllTransactions}
              className="text-xs font-medium text-primary hover:text-primary-hover"
            >
              View all →
            </button>
          </div>
          <TransactionList transactions={recentTransactions} accounts={accounts} onDelete={onDelete} onEdit={onEdit} />
        </div>
      )}
    </div>
  )
}
