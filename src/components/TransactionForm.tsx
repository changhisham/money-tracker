import { useState, type FormEvent } from 'react'
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  RECURRENCE_LABELS,
  ACCOUNT_TYPE_ICONS,
} from '../types'
import type { Account, NewTransaction, Person, Recurrence, SplitShare, Transaction, TransactionType } from '../types'
import { todayIso } from '../utils/dateRanges'
import { categoryIcon } from '../utils/categoryIcons'
import { SplitBillFields } from './SplitBillFields'
import { TagInput } from './TagInput'

const RECURRENCE_OPTIONS: (Recurrence | 'none')[] = ['none', 'weekly', 'monthly', 'yearly']
const TYPE_OPTIONS: { id: TransactionType; label: string }[] = [
  { id: 'expense', label: 'Expense' },
  { id: 'income', label: 'Income' },
  { id: 'transfer', label: 'Transfer' },
]

interface Props {
  accounts: Account[]
  people: Person[]
  knownExpenseCategories: string[]
  knownIncomeCategories: string[]
  initialValues?: Transaction
  onSubmit: (values: NewTransaction) => Promise<void>
  onCancel?: () => void
  onAddPerson: (name: string) => Promise<string>
}

export function TransactionForm({
  accounts,
  people,
  knownExpenseCategories,
  knownIncomeCategories,
  initialValues,
  onSubmit,
  onCancel,
  onAddPerson,
}: Props) {
  const isEditing = Boolean(initialValues)
  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'expense')
  const [amount, setAmount] = useState(initialValues ? String(initialValues.amount) : '')
  const [accountId, setAccountId] = useState(initialValues?.accountId ?? accounts[0]?.id ?? '')
  const [toAccountId, setToAccountId] = useState(initialValues?.toAccountId ?? '')
  const [category, setCategory] = useState(
    initialValues?.category ?? (type === 'income' ? knownIncomeCategories[0] ?? DEFAULT_INCOME_CATEGORIES[0] : knownExpenseCategories[0] ?? DEFAULT_EXPENSE_CATEGORIES[0]),
  )
  const [date, setDate] = useState(initialValues?.date ?? todayIso())
  const [payee, setPayee] = useState(initialValues?.payee ?? '')
  const [note, setNote] = useState(initialValues?.note ?? '')
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [recurrence, setRecurrence] = useState<Recurrence | 'none'>(initialValues?.recurrence ?? 'none')
  const [recurrenceEnd, setRecurrenceEnd] = useState(initialValues?.recurrenceEnd ?? '')
  const [excluded, setExcluded] = useState(initialValues?.excluded ?? false)
  const [splitWith, setSplitWith] = useState<SplitShare[]>(initialValues?.splitWith ?? [])
  const [splitting, setSplitting] = useState(Boolean(initialValues?.splitWith?.length))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const account = accounts.find((a) => a.id === accountId)
  const currency = account?.currency ?? ''
  const expenseCategoryOptions = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...knownExpenseCategories])]
  const incomeCategoryOptions = [...new Set([...DEFAULT_INCOME_CATEGORIES, ...knownIncomeCategories])]
  const categoryOptions = type === 'income' ? incomeCategoryOptions : expenseCategoryOptions
  const toAccountOptions = accounts.filter((a) => a.id !== accountId && a.currency === currency)

  function changeType(next: TransactionType) {
    setType(next)
    if (next === 'income') setCategory(knownIncomeCategories[0] ?? DEFAULT_INCOME_CATEGORIES[0])
    else if (next === 'expense') setCategory(knownExpenseCategories[0] ?? DEFAULT_EXPENSE_CATEGORIES[0])
    if (next !== 'expense') {
      setSplitting(false)
      setSplitWith([])
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!parsed || parsed <= 0 || !accountId) return
    if (type === 'transfer' && !toAccountId) return

    setSaving(true)
    try {
      const recurringGroupId =
        recurrence === 'none' ? null : initialValues?.recurringGroupId ?? crypto.randomUUID()

      await onSubmit({
        type,
        amount: parsed,
        currency,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        category: type === 'transfer' ? null : category,
        payee: type === 'transfer' ? null : payee.trim() || null,
        tags: tags.length > 0 ? tags : null,
        date,
        note: note.trim(),
        recurrence: recurrence === 'none' ? null : recurrence,
        recurringGroupId,
        recurrenceEnd: recurrence === 'none' ? null : recurrenceEnd || null,
        excluded,
        splitWith: type === 'expense' && splitting && splitWith.length > 0 ? splitWith : null,
      })

      if (!isEditing) {
        setAmount('')
        setPayee('')
        setNote('')
        setTags([])
        setSplitWith([])
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1500)
    } finally {
      setSaving(false)
    }
  }

  if (accounts.length === 0) {
    return (
      <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
        Add an account in Settings before recording transactions.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex rounded-xl bg-surface p-1">
        {TYPE_OPTIONS.map((opt) => (
          <button
            type="button"
            key={opt.id}
            onClick={() => changeType(opt.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              opt.id === type ? 'bg-emerald-500 text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Amount</label>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-lg text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
          />
          <span className="flex w-16 items-center justify-center rounded-xl border border-line bg-base text-sm font-medium text-ink-soft">
            {currency || '—'}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">
          {type === 'transfer' ? 'From account' : 'Account'}
        </label>
        <select
          value={accountId}
          onChange={(e) => {
            setAccountId(e.target.value)
            setToAccountId('')
          }}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-emerald-500"
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {ACCOUNT_TYPE_ICONS[a.type]} {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>

      {type === 'transfer' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">To account</label>
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            required
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-emerald-500"
          >
            <option value="" disabled>
              Select an account
            </option>
            {toAccountOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {ACCOUNT_TYPE_ICONS[a.type]} {a.name} ({a.currency})
              </option>
            ))}
          </select>
          {toAccountOptions.length === 0 && (
            <p className="mt-1 text-xs text-ink-faint">
              No other {currency} accounts to transfer to.
            </p>
          )}
        </div>
      )}

      {type !== 'transfer' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-emerald-500"
          >
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {categoryIcon(c)} {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {type !== 'transfer' && (
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Payee (optional)</label>
          <input
            type="text"
            placeholder="e.g. Starbucks, Tenaga Nasional"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
          />
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Date</label>
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Note (optional)</label>
        <input
          type="text"
          placeholder="e.g. Lunch with team"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Tags (optional)</label>
        <TagInput value={tags} onChange={setTags} />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft">Repeat</label>
        <div className="flex rounded-xl bg-base p-1">
          {RECURRENCE_OPTIONS.map((r) => (
            <button
              type="button"
              key={r}
              onClick={() => setRecurrence(r)}
              className={`flex-1 rounded-lg py-2 text-xs font-medium transition ${
                r === recurrence ? 'bg-emerald-500 text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {r === 'none' ? 'Once' : RECURRENCE_LABELS[r]}
            </button>
          ))}
        </div>
        {recurrence !== 'none' && (
          <div className="mt-2">
            <label className="mb-1 block text-xs font-medium text-ink-soft">Ends on (optional)</label>
            <input
              type="date"
              value={recurrenceEnd}
              min={date}
              onChange={(e) => setRecurrenceEnd(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-emerald-500"
            />
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
        <input
          type="checkbox"
          checked={excluded}
          onChange={(e) => setExcluded(e.target.checked)}
          className="h-4 w-4 rounded border-line accent-emerald-500"
        />
        Exclude from budgets &amp; reports
      </label>

      {type === 'expense' && (
        <div>
          <label className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <input
              type="checkbox"
              checked={splitting}
              onChange={(e) => {
                setSplitting(e.target.checked)
                if (!e.target.checked) setSplitWith([])
              }}
              className="h-4 w-4 rounded border-line accent-emerald-500"
            />
            Split this bill
          </label>
          {splitting && (
            <div className="mt-2">
              <SplitBillFields
                amount={Number(amount) || 0}
                currency={currency}
                people={people}
                value={splitWith}
                onChange={setSplitWith}
                onAddPerson={onAddPerson}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-xl border border-line px-4 py-3 font-medium text-ink-soft hover:bg-surface-hover"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 font-medium text-white transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : isEditing ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  )
}
