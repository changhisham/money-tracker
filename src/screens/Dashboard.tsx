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
import { AccountsOverview } from '../components/AccountsOverview'
import { TransactionList } from '../components/TransactionList'
import { getRange, shiftAnchor } from '../utils/dateRanges'
import { inRange, incomeExpenseByCurrency, periodSeries, totalsByCategory } from '../utils/summary'
import { transactionsToCsv, downloadCsv } from '../utils/csv'
import { categoryIcon } from '../utils/categoryIcons'
import { computeAccountBalances } from '../utils/accountBalances'
import { upcomingOccurrences } from '../utils/recurring'
import type { Account, Budget, NewTransaction, Transaction, TransactionType, Period } from '../types'

const ALL_CATEGORIES = '__all__'
const ALL_TYPES = '__all__'
const SPARK_LENGTH = 6

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
  name: string
  email: string | null
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
  onAddTransaction: (transaction: NewTransaction) => Promise<void>
}

export function Dashboard({ transactions, accounts, budgets, name, email, onDelete, onEdit, onAddTransaction }: Props) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [anchor, setAnchor] = useState(new Date())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [typeFilter, setTypeFilter] = useState<TransactionType | typeof ALL_TYPES>(ALL_TYPES)

  const includedTransactions = useMemo(() => transactions.filter((t) => !t.excluded), [transactions])

  const range = useMemo(() => getRange(period, anchor), [period, anchor])
  const periodTransactions = useMemo(() => inRange(transactions, range), [transactions, range])
  const includedPeriodTransactions = useMemo(
    () => inRange(includedTransactions, range),
    [includedTransactions, range],
  )
  const totals = useMemo(() => incomeExpenseByCurrency(includedPeriodTransactions), [includedPeriodTransactions])
  const primaryCurrency = totals[0]?.currency ?? accounts[0]?.currency ?? ''
  const isCurrent = useMemo(
    () => getRange(period, new Date()).label === range.label,
    [period, range],
  )

  const balances = useMemo(() => computeAccountBalances(accounts, transactions), [accounts, transactions])
  const categories = useMemo(
    () => [...new Set(periodTransactions.map((t) => t.category).filter((c): c is string => Boolean(c)))],
    [periodTransactions],
  )
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
    () => totalsByCategory(includedPeriodTransactions, primaryCurrency, 'expense'),
    [includedPeriodTransactions, primaryCurrency],
  )
  const overBudgetCount = categoryBudgets.filter((b) => {
    const spent = expenseByCategory.find((c) => c.category === b.category)?.total ?? 0
    return spent > b.amount
  }).length

  const upcoming = useMemo(
    () => upcomingOccurrences(transactions, 14).filter((o) => o.latest.currency === primaryCurrency),
    [transactions, primaryCurrency],
  )
  const upcomingTotal = upcoming.reduce((sum, o) => sum + o.latest.amount, 0)

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return periodTransactions.filter((t) => {
      if (typeFilter !== ALL_TYPES && t.type !== typeFilter) return false
      if (categoryFilter !== ALL_CATEGORIES && t.category !== categoryFilter) return false
      if (term) {
        const haystack = `${t.category ?? ''} ${t.payee ?? ''} ${(t.tags ?? []).join(' ')} ${t.note}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [periodTransactions, search, categoryFilter, typeFilter])

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
          label="Expenses"
          value={primaryTotal ? `${primaryCurrency} ${primaryTotal.expense.toFixed(0)}` : '—'}
          icon="💸"
          iconBg="#ef444426"
          trendPct={trendPct(expenseSeries)}
          goodDirection="down"
          sparkline={expenseSeries}
        />
        <StatCard
          label="Net"
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

      <CategoryChart transactions={includedPeriodTransactions} currencyTotals={totals.map((t) => ({ currency: t.currency, total: t.expense }))} budgets={budgets} period={period} />
      <SpendingTrend transactions={includedTransactions} period={period} anchor={anchor} currencies={allCurrencies} />
      <InsightsCard transactions={includedTransactions} period={period} anchor={anchor} currency={primaryCurrency} />

      {allCurrencies.length > 1 && <SummaryCards totals={totals} budgets={budgets} period={period} />}

      {periodTransactions.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-ink-soft">Transactions</h2>
            <button
              onClick={() => downloadCsv(`transactions-${range.label}.csv`, transactionsToCsv(filtered, accounts))}
              className="rounded-lg border border-line px-2.5 py-1 text-xs font-medium text-ink-soft hover:bg-surface-hover"
            >
              Export CSV
            </button>
          </div>

          <div className="mb-3 flex gap-2">
            <input
              type="text"
              placeholder="Search notes, payee, tags…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | typeof ALL_TYPES)}
              className="rounded-xl border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-emerald-500"
            >
              <option value={ALL_TYPES}>All types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-emerald-500"
            >
              <option value={ALL_CATEGORIES}>All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryIcon(c)} {c}
                </option>
              ))}
            </select>
          </div>

          {filtered.length > 0 ? (
            <TransactionList transactions={filtered} accounts={accounts} onDelete={onDelete} onEdit={onEdit} />
          ) : (
            <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
              No transactions match your search.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
