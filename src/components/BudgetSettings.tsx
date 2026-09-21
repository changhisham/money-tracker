import { useState, type FormEvent } from 'react'
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_CURRENCIES, PERIOD_LABELS, type Budget, type Period } from '../types'
import { formatMoney } from '../utils/dateRanges'
import { categoryIcon } from '../utils/categoryIcons'

const PERIODS: Period[] = ['weekly', 'monthly', 'yearly']
const ALL_CATEGORIES = '__all__'

interface Props {
  budgets: Budget[]
  knownCurrencies: string[]
  knownCategories: string[]
  onSave: (period: Period, currency: string, amount: number, category?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function BudgetSettings({ budgets, knownCurrencies, knownCategories, onSave, onDelete }: Props) {
  const currencyOptions = [...new Set([...knownCurrencies, ...DEFAULT_CURRENCIES])]
  const categoryOptions = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...knownCategories])]
  const [period, setPeriod] = useState<Period>('monthly')
  const [currency, setCurrency] = useState(currencyOptions[0])
  const [category, setCategory] = useState(ALL_CATEGORIES)
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const parsed = Number(amount)
    if (!parsed || parsed < 0) return
    setSaving(true)
    try {
      await onSave(period, currency, parsed, category === ALL_CATEGORIES ? undefined : category)
      setAmount('')
    } finally {
      setSaving(false)
    }
  }

  const overall = budgets.filter((b) => !b.category)
  const perCategory = budgets.filter((b) => b.category)

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-4">
        <h2 className="text-sm font-medium text-ink-soft">Set a budget</h2>

        <div className="flex rounded-xl bg-base p-1">
          {PERIODS.map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                p === period ? 'bg-primary text-white' : 'text-ink-soft hover:text-ink'
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft">Applies to</label>
          <select
            value={category}
            onChange={(ev) => setCategory(ev.target.value)}
            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-primary"
          >
            <option value={ALL_CATEGORIES}>All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {categoryIcon(c)} {c}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            required
            placeholder="Budget amount"
            value={amount}
            onChange={(ev) => setAmount(ev.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-3 text-ink placeholder-ink-faint outline-none focus:border-primary"
          />
          <select
            value={currency}
            onChange={(ev) => setCurrency(ev.target.value)}
            className="w-24 rounded-xl border border-line bg-surface px-2 text-ink outline-none focus:border-primary"
          >
            {currencyOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-primary px-4 py-3 font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : `Save ${PERIOD_LABELS[period].toLowerCase()} budget`}
        </button>
      </form>

      <div className="space-y-6">
        {budgets.length === 0 && (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-ink-faint">
            No budgets set yet. Use the form to set your first one.
          </p>
        )}

        {overall.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink-soft">Overall budgets</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {overall.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm"
                >
                  <span className="text-ink-soft">
                    {PERIOD_LABELS[b.period]} · {b.currency}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink">{formatMoney(b.amount, b.currency)}</span>
                    <button
                      onClick={() => onDelete(b.id)}
                      aria-label="Delete budget"
                      className="text-ink-faint hover:text-red-400"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {perCategory.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink-soft">Category budgets</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {perCategory.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-sm"
                >
                  <span className="flex items-center gap-1.5 text-ink-soft">
                    <span aria-hidden>{categoryIcon(b.category!)}</span>
                    {b.category} · {PERIOD_LABELS[b.period]} · {b.currency}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-ink">{formatMoney(b.amount, b.currency)}</span>
                    <button
                      onClick={() => onDelete(b.id)}
                      aria-label="Delete budget"
                      className="text-ink-faint hover:text-red-400"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
