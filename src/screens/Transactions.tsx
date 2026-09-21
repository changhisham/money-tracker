import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { PeriodSelector } from '../components/PeriodSelector'
import { TransactionList } from '../components/TransactionList'
import { getRange, shiftAnchor, formatMoney } from '../utils/dateRanges'
import { inRange, incomeExpenseByCurrency } from '../utils/summary'
import { transactionsToCsv, downloadCsv } from '../utils/csv'
import { categoryIcon } from '../utils/categoryIcons'
import type { Account, Period, Transaction, TransactionType } from '../types'

const ALL_CATEGORIES = '__all__'
const ALL_TYPES = '__all__'

interface Props {
  transactions: Transaction[]
  accounts: Account[]
  onDelete: (id: string) => void
  onEdit: (transaction: Transaction) => void
}

export function Transactions({ transactions, accounts, onDelete, onEdit }: Props) {
  const [period, setPeriod] = useState<Period>('monthly')
  const [anchor, setAnchor] = useState(new Date())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES)
  const [typeFilter, setTypeFilter] = useState<TransactionType | typeof ALL_TYPES>(ALL_TYPES)

  const range = useMemo(() => getRange(period, anchor), [period, anchor])
  const isCurrent = useMemo(() => getRange(period, new Date()).label === range.label, [period, range])
  const periodTransactions = useMemo(() => inRange(transactions, range), [transactions, range])
  const includedTotals = useMemo(
    () => incomeExpenseByCurrency(periodTransactions.filter((t) => !t.excluded)),
    [periodTransactions],
  )

  const categories = useMemo(
    () => [...new Set(periodTransactions.map((t) => t.category).filter((c): c is string => Boolean(c)))],
    [periodTransactions],
  )

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

  return (
    <div className="space-y-4 pb-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
        />
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

      {includedTotals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {(() => {
            const t = includedTotals[0]
            return (
              <>
                <div className="rounded-2xl border border-line bg-surface p-3 text-center">
                  <p className="text-[11px] text-ink-faint">Income</p>
                  <p className="mt-0.5 text-base font-semibold text-income">{formatMoney(t.income, t.currency)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-3 text-center">
                  <p className="text-[11px] text-ink-faint">Expenses</p>
                  <p className="mt-0.5 text-base font-semibold text-ink">{formatMoney(t.expense, t.currency)}</p>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-3 text-center">
                  <p className="text-[11px] text-ink-faint">Net</p>
                  <p
                    className={`mt-0.5 text-base font-semibold ${t.income - t.expense >= 0 ? 'text-income' : 'text-danger'}`}
                  >
                    {formatMoney(t.income - t.expense, t.currency)}
                  </p>
                </div>
              </>
            )
          })()}
        </div>
      )}

      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-1 gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TransactionType | typeof ALL_TYPES)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary sm:flex-none"
          >
            <option value={ALL_TYPES}>All types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary sm:flex-none"
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {categoryIcon(c)} {c}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => downloadCsv(`transactions-${range.label}.csv`, transactionsToCsv(filtered, accounts))}
          className="shrink-0 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-ink-soft hover:bg-surface-hover"
        >
          Export CSV
        </button>
      </div>

      {filtered.length > 0 ? (
        <TransactionList transactions={filtered} accounts={accounts} onDelete={onDelete} onEdit={onEdit} />
      ) : (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
          No transactions match your search.
        </p>
      )}
    </div>
  )
}
