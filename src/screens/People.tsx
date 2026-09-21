import { useState, type FormEvent } from 'react'
import { formatMoney, relativeDayLabel, todayIso } from '../utils/dateRanges'
import { owedByPerson, transactionsInvolvingPerson } from '../utils/splits'
import {
  convertTotals,
  debtPaidAmount,
  debtRemaining,
  debtsForPerson,
  oldestUnsettledDate,
  personDebtTotals,
  personStats,
  totalOwedToYouDirect,
  totalYouOwe,
} from '../utils/debts'
import { debtsToCsv, downloadCsv } from '../utils/csv'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  DEBT_DIRECTION_LABELS,
  DEFAULT_CURRENCIES,
  type Account,
  type Debt,
  type DebtDirection,
  type NewDebt,
  type Person,
  type Preferences,
  type Transaction,
} from '../types'

interface Props {
  people: Person[]
  transactions: Transaction[]
  debts: Debt[]
  accounts: Account[]
  knownCurrencies: string[]
  preferences: Preferences
  onAddPerson: (name: string) => Promise<string>
  onDeletePerson: (id: string) => Promise<void>
  onToggleSettled: (transaction: Transaction, personId: string) => Promise<void>
  onAddDebt: (debt: NewDebt) => Promise<void>
  onToggleDebtSettled: (debt: Debt) => Promise<void>
  onDeleteDebt: (id: string) => Promise<void>
  onRecordPayment: (debt: Debt, amount: number, date: string, accountId: string | null) => Promise<void>
  onUpdateDebt: (id: string, changes: { amount: number; note: string | null; dueDate: string | null }) => Promise<void>
}

type SortOption = 'name' | 'amount' | 'recent'

const SORT_LABELS: Record<SortOption, string> = {
  name: 'Name',
  amount: 'Amount owed',
  recent: 'Most recent activity',
}

function dueBadge(dueDate: string): { label: string; className: string } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(`${dueDate}T00:00:00`)
  const days = Math.round((due.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { label: `Overdue ${Math.abs(days)}d`, className: 'bg-red-500/10 text-red-400' }
  if (days === 0) return { label: 'Due today', className: 'bg-amber-500/10 text-amber-500' }
  if (days <= 7) return { label: `Due in ${days}d`, className: 'bg-amber-500/10 text-amber-500' }
  return { label: `Due ${dueDate}`, className: 'bg-surface-hover text-ink-faint' }
}

export function People({
  people,
  transactions,
  debts,
  accounts,
  knownCurrencies,
  preferences,
  onAddPerson,
  onDeletePerson,
  onToggleSettled,
  onAddDebt,
  onToggleDebtSettled,
  onDeleteDebt,
  onRecordPayment,
  onUpdateDebt,
}: Props) {
  const currencyOptions = [...new Set([...knownCurrencies, ...DEFAULT_CURRENCIES])]
  const displayCurrency = preferences.defaultCurrency ?? currencyOptions[0]

  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Person | null>(null)
  const [pendingDeleteDebt, setPendingDeleteDebt] = useState<Debt | null>(null)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('recent')

  const [loggingDebt, setLoggingDebt] = useState(false)
  const [debtPersonId, setDebtPersonId] = useState('')
  const [direction, setDirection] = useState<DebtDirection>('i_owe')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState(currencyOptions[0])
  const [date, setDate] = useState(todayIso())
  const [note, setNote] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [savingDebt, setSavingDebt] = useState(false)

  const [payingDebtId, setPayingDebtId] = useState<string | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayIso())
  const [recordAsTxn, setRecordAsTxn] = useState(true)
  const [paymentAccountId, setPaymentAccountId] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)

  const [editingDebtId, setEditingDebtId] = useState<string | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const splitOwed = owedByPerson(transactions)
  const youOweTotals = totalYouOwe(debts)
  const owedToYouDirectTotals = totalOwedToYouDirect(debts)

  const owedToYouCombinedTotals = (() => {
    const map = new Map<string, number>()
    for (const o of splitOwed) {
      for (const t of o.byCurrency) map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount)
    }
    for (const t of owedToYouDirectTotals) map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount)
    return [...map.entries()].map(([currency, amount]) => ({ currency, amount }))
  })()

  const youOweConverted = convertTotals(youOweTotals, displayCurrency, preferences.exchangeRates)
  const owedToYouConverted = convertTotals(owedToYouCombinedTotals, displayCurrency, preferences.exchangeRates)

  const personRows = people.map((person) => {
    const { youOwe, owesYou: directOwesYou } = personDebtTotals(debts, person.id)
    const splitTotals = splitOwed.find((o) => o.personId === person.id)?.byCurrency ?? []
    const owesYouMap = new Map<string, number>()
    for (const t of splitTotals) owesYouMap.set(t.currency, (owesYouMap.get(t.currency) ?? 0) + t.amount)
    for (const t of directOwesYou) owesYouMap.set(t.currency, (owesYouMap.get(t.currency) ?? 0) + t.amount)
    const owesYouTotals = [...owesYouMap.entries()].map(([currency, amount]) => ({ currency, amount }))

    const involvedTransactions = transactionsInvolvingPerson(transactions, person.id)
    const personDebts = debtsForPerson(debts, person.id)
    const owingSince = oldestUnsettledDate(debts, person.id)
    const allSettled = youOwe.length === 0 && owesYouTotals.length === 0
    const stats = personStats(debts, person.id)

    const lastActivity = Math.max(
      person.createdAt,
      ...personDebts.map((d) => d.createdAt),
      ...involvedTransactions.map((t) => t.createdAt),
    )
    const totalAmount = [...youOwe, ...owesYouTotals].reduce((sum, t) => sum + t.amount, 0)

    return {
      person,
      youOwe,
      owesYouTotals,
      involvedTransactions,
      personDebts,
      owingSince,
      allSettled,
      stats,
      lastActivity,
      totalAmount,
    }
  })

  const visibleRows = personRows
    .filter((row) => row.person.name.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name') return a.person.name.localeCompare(b.person.name)
      if (sortBy === 'amount') return b.totalAmount - a.totalAmount
      return b.lastActivity - a.lastActivity
    })

  async function handleAdd(e: FormEvent) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return
    setAdding(true)
    try {
      const id = await onAddPerson(trimmed)
      if (!debtPersonId) setDebtPersonId(id)
      setNewName('')
    } finally {
      setAdding(false)
    }
  }

  async function handleLogDebt(e: FormEvent) {
    e.preventDefault()
    const amt = Number(amount)
    if (!debtPersonId || !amt || amt <= 0) return
    setSavingDebt(true)
    try {
      await onAddDebt({
        personId: debtPersonId,
        direction,
        amount: amt,
        currency,
        date,
        note: note.trim() || null,
        dueDate: dueDate || null,
        payments: null,
        settled: false,
        settledAt: null,
      })
      setAmount('')
      setNote('')
      setDueDate('')
      setDate(todayIso())
      setLoggingDebt(false)
    } finally {
      setSavingDebt(false)
    }
  }

  function openPayForm(debt: Debt) {
    setPayingDebtId(debt.id)
    setPaymentAmount(debtRemaining(debt).toFixed(2))
    setPaymentDate(todayIso())
    const matchingAccounts = accounts.filter((a) => a.currency === debt.currency)
    setPaymentAccountId(matchingAccounts[0]?.id ?? '')
    setRecordAsTxn(matchingAccounts.length > 0)
  }

  async function handleLogPayment(e: FormEvent, debt: Debt) {
    e.preventDefault()
    const amt = Number(paymentAmount)
    if (!amt || amt <= 0) return
    setSavingPayment(true)
    try {
      await onRecordPayment(debt, amt, paymentDate, recordAsTxn && paymentAccountId ? paymentAccountId : null)
      setPayingDebtId(null)
    } finally {
      setSavingPayment(false)
    }
  }

  function openEditForm(debt: Debt) {
    setEditingDebtId(debt.id)
    setEditAmount(String(debt.amount))
    setEditNote(debt.note ?? '')
    setEditDueDate(debt.dueDate ?? '')
  }

  async function handleEditDebt(e: FormEvent, debt: Debt) {
    e.preventDefault()
    const amt = Number(editAmount)
    if (!amt || amt <= 0) return
    setSavingEdit(true)
    try {
      await onUpdateDebt(debt.id, { amount: amt, note: editNote.trim() || null, dueDate: editDueDate || null })
      setEditingDebtId(null)
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <div className="space-y-4">
      {(youOweTotals.length > 0 || owedToYouCombinedTotals.length > 0) && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {youOweTotals.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-xs text-ink-faint">You owe</p>
              <p className="mt-1 text-2xl font-semibold text-red-400">
                {youOweTotals.map((t) => formatMoney(t.amount, t.currency)).join(' · ')}
              </p>
              {youOweTotals.length > 1 && youOweConverted.converted > 0 && (
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  ≈ {formatMoney(youOweConverted.converted, displayCurrency)}
                  {youOweConverted.skipped.length > 0 && ' (partial — set rates in Settings for the rest)'}
                </p>
              )}
            </div>
          )}
          {owedToYouCombinedTotals.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-4 text-center">
              <p className="text-xs text-ink-faint">Owed to you</p>
              <p className="mt-1 text-2xl font-semibold text-income">
                {owedToYouCombinedTotals.map((t) => formatMoney(t.amount, t.currency)).join(' · ')}
              </p>
              {owedToYouCombinedTotals.length > 1 && owedToYouConverted.converted > 0 && (
                <p className="mt-0.5 text-[11px] text-ink-faint">
                  ≈ {formatMoney(owedToYouConverted.converted, displayCurrency)}
                  {owedToYouConverted.skipped.length > 0 && ' (partial — set rates in Settings for the rest)'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 rounded-2xl border border-line bg-surface p-3">
        <input
          type="text"
          placeholder="Add a person"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={adding || !newName.trim()}
          className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
        >
          Add
        </button>
      </form>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-ink-soft">Log a debt</h2>
          {people.length > 0 && (
            <button
              onClick={() => setLoggingDebt((v) => !v)}
              className="text-xs font-medium text-primary hover:text-primary-hover"
            >
              {loggingDebt ? 'Cancel' : '+ Log a debt'}
            </button>
          )}
        </div>

        {people.length === 0 ? (
          <p className="text-sm text-ink-faint">Add a person above before logging money you owe them.</p>
        ) : (
          loggingDebt && (
            <form onSubmit={handleLogDebt} className="space-y-3">
              <div className="flex gap-2">
                <select
                  value={debtPersonId}
                  onChange={(e) => setDebtPersonId(e.target.value)}
                  className="flex-1 rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="" disabled>
                    Select person…
                  </option>
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as DebtDirection)}
                  className="flex-1 rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  <option value="i_owe">{DEBT_DIRECTION_LABELS.i_owe}</option>
                  <option value="owed_to_me">{DEBT_DIRECTION_LABELS.owed_to_me}</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-20 rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Started on</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Due date (optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink outline-none focus:border-primary"
                  />
                </div>
              </div>

              <input
                type="text"
                placeholder="Note, e.g. Dinner, rent, borrowed cash (optional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
              />

              <button
                type="submit"
                disabled={savingDebt || !debtPersonId || !amount}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {savingDebt ? 'Saving…' : 'Save debt'}
              </button>
            </form>
          )
        )}
      </div>

      {people.length === 0 ? (
        <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
          Add people you split bills with, or owe money to, to start tracking.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search people…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort people"
              className="rounded-xl border border-line bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
            >
              {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                <option key={opt} value={opt}>
                  Sort: {SORT_LABELS[opt]}
                </option>
              ))}
            </select>
            <button
              onClick={() => downloadCsv('debts.csv', debtsToCsv(debts, people))}
              disabled={debts.length === 0}
              className="shrink-0 rounded-lg border border-line px-2.5 py-2 text-xs font-medium text-ink-soft hover:bg-surface-hover disabled:opacity-40"
            >
              Export debts CSV
            </button>
          </div>

          {visibleRows.length === 0 && (
            <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
              No people match "{search}".
            </p>
          )}

          <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRows.map((row) => {
              const { person, youOwe, owesYouTotals, involvedTransactions, personDebts, owingSince, allSettled, stats } =
                row
              const isExpanded = expanded === person.id

              return (
                <div key={person.id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() => setExpanded(isExpanded ? null : person.id)}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-sm font-medium text-ink-soft">
                        {person.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{person.name}</p>
                        <p className="text-xs text-ink-faint">
                          {allSettled
                            ? 'All settled up'
                            : [
                                ...youOwe.map((t) => `you owe ${formatMoney(t.amount, t.currency)}`),
                                ...owesYouTotals.map((t) => `owes you ${formatMoney(t.amount, t.currency)}`),
                              ].join(' · ')}
                        </p>
                        {owingSince && (
                          <p className="text-[11px] text-ink-faint">Owing since {relativeDayLabel(owingSince)}</p>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => setPendingDelete(person)}
                      aria-label={`Remove ${person.name}`}
                      className="shrink-0 text-ink-faint hover:text-red-400"
                    >
                      🗑
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 border-t border-line pt-3">
                      {stats.debtCount > 0 && (
                        <div className="mb-3 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-surface-hover px-2 py-1.5">
                            <p className="text-sm font-semibold text-ink">{stats.debtCount}</p>
                            <p className="text-[10px] text-ink-faint">Debts logged</p>
                          </div>
                          <div className="rounded-lg bg-surface-hover px-2 py-1.5">
                            <p className="text-sm font-semibold text-ink">{stats.settledCount}</p>
                            <p className="text-[10px] text-ink-faint">Settled</p>
                          </div>
                          <div className="rounded-lg bg-surface-hover px-2 py-1.5">
                            <p className={`text-sm font-semibold ${stats.overdueCount > 0 ? 'text-red-400' : 'text-ink'}`}>
                              {stats.overdueCount}
                            </p>
                            <p className="text-[10px] text-ink-faint">Overdue</p>
                          </div>
                          {stats.totalBorrowed.length > 0 && (
                            <p className="col-span-3 text-[11px] text-ink-faint">
                              Lifetime borrowed from them:{' '}
                              <span className="font-medium text-ink-soft">
                                {stats.totalBorrowed.map((t) => formatMoney(t.amount, t.currency)).join(' · ')}
                              </span>
                            </p>
                          )}
                          {stats.totalLent.length > 0 && (
                            <p className="col-span-3 text-[11px] text-ink-faint">
                              Lifetime lent to them:{' '}
                              <span className="font-medium text-ink-soft">
                                {stats.totalLent.map((t) => formatMoney(t.amount, t.currency)).join(' · ')}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      <ul className="space-y-3">
                      {involvedTransactions.length === 0 && personDebts.length === 0 && (
                        <p className="text-xs text-ink-faint">No shared expenses or debts yet.</p>
                      )}
                      {personDebts.map((d) => {
                        const remaining = debtRemaining(d)
                        const paid = debtPaidAmount(d)
                        const hasPayments = paid > 0
                        const badge = d.dueDate && !d.settled ? dueBadge(d.dueDate) : null
                        const isPaying = payingDebtId === d.id
                        const isEditing = editingDebtId === d.id
                        const matchingAccounts = accounts.filter((a) => a.currency === d.currency)

                        return (
                          <li key={d.id} className="space-y-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 flex-1 truncate text-ink-soft">
                                {DEBT_DIRECTION_LABELS[d.direction]} · {d.note || 'No note'}
                                <span className="block text-[11px] text-ink-faint">
                                  since {relativeDayLabel(d.date)}
                                  {hasPayments && !d.settled && ` · ${formatMoney(paid, d.currency)} paid`}
                                </span>
                              </span>
                              <span className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                                {badge && (
                                  <span className={`rounded-lg px-2 py-1 text-[11px] font-medium ${badge.className}`}>
                                    {badge.label}
                                  </span>
                                )}
                                <button
                                  onClick={() => onToggleDebtSettled(d)}
                                  className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                                    d.settled
                                      ? 'bg-success/10 text-success'
                                      : 'bg-surface-hover text-ink-soft hover:text-ink'
                                  }`}
                                >
                                  {d.settled ? 'Settled ✓' : `${formatMoney(remaining, d.currency)} left`}
                                </button>
                                {!d.settled && (
                                  <button
                                    onClick={() => (isPaying ? setPayingDebtId(null) : openPayForm(d))}
                                    className="rounded-lg bg-surface-hover px-2.5 py-1 text-xs font-medium text-ink-soft hover:text-ink"
                                  >
                                    {isPaying ? 'Cancel' : '+ Payment'}
                                  </button>
                                )}
                                {!d.settled && (
                                  <button
                                    onClick={() => (isEditing ? setEditingDebtId(null) : openEditForm(d))}
                                    aria-label="Edit debt"
                                    className="text-ink-faint hover:text-primary"
                                  >
                                    ✏️
                                  </button>
                                )}
                                <button
                                  onClick={() => setPendingDeleteDebt(d)}
                                  aria-label="Delete debt"
                                  className="text-ink-faint hover:text-red-400"
                                >
                                  🗑
                                </button>
                              </span>
                            </div>

                            {hasPayments && (d.payments?.length ?? 0) > 0 && (
                              <ul className="space-y-1 border-l border-line pl-2.5">
                                {d.payments!.map((p) => (
                                  <li key={p.id} className="flex items-center justify-between text-[11px] text-ink-faint">
                                    <span>Payment on {relativeDayLabel(p.date)}</span>
                                    <span className="font-medium text-ink-soft">{formatMoney(p.amount, d.currency)}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {isEditing && (
                              <form
                                onSubmit={(e) => handleEditDebt(e, d)}
                                className="space-y-2 rounded-xl border border-line bg-base p-3"
                              >
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="Amount"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                                  />
                                  <input
                                    type="date"
                                    value={editDueDate}
                                    onChange={(e) => setEditDueDate(e.target.value)}
                                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                                  />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Note (optional)"
                                  value={editNote}
                                  onChange={(e) => setEditNote(e.target.value)}
                                  className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
                                />
                                <button
                                  type="submit"
                                  disabled={savingEdit || !editAmount}
                                  className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                                >
                                  {savingEdit ? 'Saving…' : 'Save changes'}
                                </button>
                              </form>
                            )}

                            {isPaying && (
                              <form
                                onSubmit={(e) => handleLogPayment(e, d)}
                                className="space-y-2 rounded-xl border border-line bg-base p-3"
                              >
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    min="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                                  />
                                  <input
                                    type="date"
                                    value={paymentDate}
                                    onChange={(e) => setPaymentDate(e.target.value)}
                                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                                  />
                                </div>
                                {matchingAccounts.length > 0 ? (
                                  <>
                                    <label className="flex items-center gap-2 text-xs text-ink-soft">
                                      <input
                                        type="checkbox"
                                        checked={recordAsTxn}
                                        onChange={(e) => setRecordAsTxn(e.target.checked)}
                                        className="h-4 w-4 rounded border-line accent-primary"
                                      />
                                      Also record as a transaction (
                                      {d.direction === 'i_owe' ? 'expense' : 'income'})
                                    </label>
                                    {recordAsTxn && (
                                      <select
                                        value={paymentAccountId}
                                        onChange={(e) => setPaymentAccountId(e.target.value)}
                                        className="w-full rounded-lg border border-line bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-primary"
                                      >
                                        {matchingAccounts.map((a) => (
                                          <option key={a.id} value={a.id}>
                                            {a.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </>
                                ) : (
                                  <p className="text-[11px] text-ink-faint">
                                    No {d.currency} account to record a transaction against — this payment will only
                                    update the debt.
                                  </p>
                                )}
                                <button
                                  type="submit"
                                  disabled={savingPayment || !paymentAmount}
                                  className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                                >
                                  {savingPayment ? 'Saving…' : 'Save payment'}
                                </button>
                              </form>
                            )}
                          </li>
                        )
                      })}
                      {involvedTransactions.map((t) => {
                        const share = t.splitWith!.find((s) => s.personId === person.id)!
                        return (
                          <li key={t.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className="min-w-0 truncate text-ink-soft">
                              {t.category} · {t.note || t.date}
                            </span>
                            <button
                              onClick={() => onToggleSettled(t, person.id)}
                              className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${
                                share.settled
                                  ? 'bg-success/10 text-success'
                                  : 'bg-surface-hover text-ink-soft hover:text-ink'
                              }`}
                            >
                              {formatMoney(share.amount, t.currency)} {share.settled ? '· Settled ✓' : '· Mark settled'}
                            </button>
                          </li>
                        )
                      })}
                      </ul>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Remove ${pendingDelete.name}?`}
          message="This removes them from your people list. Past split records and debts stay on record."
          confirmLabel="Remove"
          onConfirm={() => {
            onDeletePerson(pendingDelete.id)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {pendingDeleteDebt && (
        <ConfirmDialog
          title="Delete this debt record?"
          message="This permanently removes the record of this debt, including any logged payments. This cannot be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            onDeleteDebt(pendingDeleteDebt.id)
            setPendingDeleteDebt(null)
          }}
          onCancel={() => setPendingDeleteDebt(null)}
        />
      )}
    </div>
  )
}
