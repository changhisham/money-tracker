import { useState, type FormEvent } from 'react'
import { deleteUser } from 'firebase/auth'
import { format } from 'date-fns'
import { ThemeToggle } from '../components/ThemeToggle'
import { AccentPicker } from '../components/AccentPicker'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useAuth } from '../context/AuthContext'
import { auth } from '../firebase'
import { deleteAllTransactions } from '../hooks/useTransactions'
import { deleteAllBudgets } from '../hooks/useBudgets'
import { deleteAllAccounts } from '../hooks/useAccounts'
import { deleteAllPeople } from '../hooks/usePeople'
import { deleteAllDebts } from '../hooks/useDebts'
import { APP_VERSION, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES, DEFAULT_CURRENCIES } from '../types'
import type { Preferences } from '../types'
import { categoryIcon, isKnownExpenseCategory, isKnownIncomeCategory } from '../utils/categoryIcons'

interface Stats {
  accounts: number
  transactions: number
  people: number
}

interface Props {
  uid: string
  email: string | null
  name: string
  knownCurrencies: string[]
  preferences: Preferences
  stats: Stats
  onSetDisplayName: (name: string) => Promise<void>
  onSetDefaultCurrency: (currency: string) => Promise<void>
  onAddExpenseCategory: (category: string) => Promise<void>
  onRemoveExpenseCategory: (category: string) => Promise<void>
  onAddIncomeCategory: (category: string) => Promise<void>
  onRemoveIncomeCategory: (category: string) => Promise<void>
  onSetExchangeRate: (currency: string, rate: number) => Promise<void>
  onRemoveExchangeRate: (currency: string) => Promise<void>
  onOpenAccounts: () => void
  onOpenLoans: () => void
}

export function Settings({
  uid,
  email,
  name,
  knownCurrencies,
  preferences,
  stats,
  onSetDisplayName,
  onSetDefaultCurrency,
  onAddExpenseCategory,
  onRemoveExpenseCategory,
  onAddIncomeCategory,
  onRemoveIncomeCategory,
  onSetExchangeRate,
  onRemoveExchangeRate,
  onOpenAccounts,
  onOpenLoans,
}: Props) {
  const { logOut } = useAuth()
  const currencyOptions = [...new Set([...knownCurrencies, ...DEFAULT_CURRENCIES])]
  const defaultCurrency = preferences.defaultCurrency ?? currencyOptions[0]
  const [editingName, setEditingName] = useState(false)
  const [displayName, setDisplayNameInput] = useState(preferences.displayName ?? '')
  const [newExpenseCategory, setNewExpenseCategory] = useState('')
  const [newIncomeCategory, setNewIncomeCategory] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const otherCurrencies = currencyOptions.filter((c) => c !== defaultCurrency)
  const [rateCurrency, setRateCurrency] = useState(otherCurrencies[0] ?? '')
  const [rateValue, setRateValue] = useState('')

  async function handleSaveRate(e: FormEvent) {
    e.preventDefault()
    const rate = Number(rateValue)
    if (!rateCurrency || !rate || rate <= 0) return
    await onSetExchangeRate(rateCurrency, rate)
    setRateValue('')
  }

  const memberSince = auth.currentUser?.metadata.creationTime
    ? format(new Date(auth.currentUser.metadata.creationTime), 'MMMM yyyy')
    : null

  async function handleSaveDisplayName(e: FormEvent) {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) return
    await onSetDisplayName(trimmed)
    setEditingName(false)
  }

  async function handleAddExpenseCategory(e: FormEvent) {
    e.preventDefault()
    const trimmed = newExpenseCategory.trim()
    if (!trimmed) return
    await onAddExpenseCategory(trimmed)
    setNewExpenseCategory('')
  }

  async function handleAddIncomeCategory(e: FormEvent) {
    e.preventDefault()
    const trimmed = newIncomeCategory.trim()
    if (!trimmed) return
    await onAddIncomeCategory(trimmed)
    setNewIncomeCategory('')
  }

  async function handleDeleteAccount() {
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteAllTransactions(uid)
      await deleteAllBudgets(uid)
      await deleteAllAccounts(uid)
      await deleteAllPeople(uid)
      await deleteAllDebts(uid)
      await deleteUser(auth.currentUser!)
    } catch (err) {
      const code = (err as { code?: string }).code
      setDeleteError(
        code === 'auth/requires-recent-login'
          ? 'For security, sign out and sign back in, then try deleting your account again.'
          : err instanceof Error
            ? err.message
            : 'Something went wrong deleting your account.',
      )
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-semibold text-white">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            {editingName ? (
              <form onSubmit={handleSaveDisplayName} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2 text-sm text-ink outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!displayName.trim()}
                  className="shrink-0 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Save
                </button>
              </form>
            ) : (
              <button onClick={() => setEditingName(true)} className="group flex items-center gap-1.5 text-left">
                <span className="truncate text-lg font-semibold text-ink">{name}</span>
                <span className="text-xs text-ink-faint opacity-0 group-hover:opacity-100">✏️</span>
              </button>
            )}
            <p className="truncate text-sm text-ink-faint">{email}</p>
            {memberSince && <p className="text-xs text-ink-faint">Member since {memberSince}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-center">
          <div>
            <p className="text-lg font-semibold text-ink">{stats.accounts}</p>
            <p className="text-[11px] text-ink-faint">Accounts</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{stats.transactions}</p>
            <p className="text-[11px] text-ink-faint">Transactions</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-ink">{stats.people}</p>
            <p className="text-[11px] text-ink-faint">People</p>
          </div>
        </div>

        <button
          onClick={() => logOut()}
          className="mt-4 w-full rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-surface-hover"
        >
          Sign out
        </button>
      </div>

      <button
        onClick={onOpenAccounts}
        className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-left hover:bg-surface-hover md:hidden"
      >
        <span className="text-sm font-medium text-ink-soft">🏦 Manage accounts</span>
        <span className="text-ink-faint">→</span>
      </button>

      <button
        onClick={onOpenLoans}
        className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface p-4 text-left hover:bg-surface-hover md:hidden"
      >
        <span className="text-sm font-medium text-ink-soft">📉 View loans</span>
        <span className="text-ink-faint">→</span>
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Appearance</h2>
          <ThemeToggle />
          <h3 className="mt-4 mb-2 text-xs font-medium text-ink-soft">Accent color</h3>
          <AccentPicker />
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Default currency</h2>
          <select
            value={preferences.defaultCurrency ?? currencyOptions[0]}
            onChange={(e) => onSetDefaultCurrency(e.target.value)}
            className="w-full rounded-xl border border-line bg-base px-4 py-3 text-ink outline-none focus:border-primary"
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="text-sm font-medium text-ink-soft">Exchange rates</h2>
          <p className="mb-3 text-xs text-ink-faint">
            Manual rates to {defaultCurrency}, used to show a combined total when money owed spans currencies.
          </p>
          {otherCurrencies.length === 0 ? (
            <p className="text-sm text-ink-faint">Add another currency (via an account) to set a rate for it.</p>
          ) : (
            <>
              <ul className="mb-3 space-y-1.5">
                {Object.entries(preferences.exchangeRates ?? {}).map(([currency, rate]) => (
                  <li key={currency} className="flex items-center justify-between gap-2 text-sm text-ink-soft">
                    <span>
                      1 {currency} = {rate} {defaultCurrency}
                    </span>
                    <button
                      onClick={() => onRemoveExchangeRate(currency)}
                      aria-label={`Remove ${currency} rate`}
                      className="text-ink-faint hover:text-red-400"
                    >
                      🗑
                    </button>
                  </li>
                ))}
                {Object.keys(preferences.exchangeRates ?? {}).length === 0 && (
                  <p className="text-sm text-ink-faint">No rates set yet.</p>
                )}
              </ul>
              <form onSubmit={handleSaveRate} className="flex gap-2">
                <select
                  value={rateCurrency}
                  onChange={(e) => setRateCurrency(e.target.value)}
                  className="rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-primary"
                >
                  {otherCurrencies.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.0001"
                  min="0"
                  placeholder={`Rate to ${defaultCurrency}`}
                  value={rateValue}
                  onChange={(e) => setRateValue(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  disabled={!rateValue}
                  className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  Save
                </button>
              </form>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Expense categories</h2>
          <ul className="mb-3 space-y-1.5">
            {DEFAULT_EXPENSE_CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-ink-soft">
                <span aria-hidden>{categoryIcon(c)}</span>
                {c}
                <span className="text-xs text-ink-faint">(built-in)</span>
              </li>
            ))}
            {(preferences.customExpenseCategories ?? []).map((c) => (
              <li key={c} className="flex items-center justify-between gap-2 text-sm text-ink-soft">
                <span className="flex items-center gap-2">
                  <span aria-hidden>{categoryIcon(c)}</span>
                  {c}
                </span>
                <button
                  onClick={() => onRemoveExpenseCategory(c)}
                  aria-label={`Remove ${c} category`}
                  className="text-ink-faint hover:text-red-400"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddExpenseCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a custom category"
              value={newExpenseCategory}
              onChange={(e) => setNewExpenseCategory(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-base px-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!newExpenseCategory.trim() || isKnownExpenseCategory(newExpenseCategory.trim())}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-soft">Income categories</h2>
          <ul className="mb-3 space-y-1.5">
            {DEFAULT_INCOME_CATEGORIES.map((c) => (
              <li key={c} className="flex items-center gap-2 text-sm text-ink-soft">
                <span aria-hidden>{categoryIcon(c)}</span>
                {c}
                <span className="text-xs text-ink-faint">(built-in)</span>
              </li>
            ))}
            {(preferences.customIncomeCategories ?? []).map((c) => (
              <li key={c} className="flex items-center justify-between gap-2 text-sm text-ink-soft">
                <span className="flex items-center gap-2">
                  <span aria-hidden>{categoryIcon(c)}</span>
                  {c}
                </span>
                <button
                  onClick={() => onRemoveIncomeCategory(c)}
                  aria-label={`Remove ${c} category`}
                  className="text-ink-faint hover:text-red-400"
                >
                  🗑
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={handleAddIncomeCategory} className="flex gap-2">
            <input
              type="text"
              placeholder="Add a custom category"
              value={newIncomeCategory}
              onChange={(e) => setNewIncomeCategory(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-base px-4 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={!newIncomeCategory.trim() || isKnownIncomeCategory(newIncomeCategory.trim())}
              className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4">
        <h2 className="mb-1 text-sm font-medium text-red-400">Danger zone</h2>
        <p className="mb-3 text-xs text-ink-faint">
          Permanently deletes your account and all transactions, accounts, budgets, people and debts. This
          cannot be undone.
        </p>
        {deleteError && <p className="mb-3 text-xs text-red-400">{deleteError}</p>}
        <button
          onClick={() => setConfirmingDelete(true)}
          className="w-full rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
        >
          Delete account
        </button>
      </div>

      <p className="pb-2 text-center text-xs text-ink-faint md:hidden">
        v{APP_VERSION} · © {new Date().getFullYear()} Money Tracker
      </p>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete your account?"
          message="This permanently deletes your account along with every transaction, account, budget, person, and debt. This cannot be undone."
          confirmLabel={deleting ? 'Deleting…' : 'Delete everything'}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  )
}
