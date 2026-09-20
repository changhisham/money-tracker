import { useState, type FormEvent } from 'react'
import {
  ACCOUNT_TYPE_ICONS,
  ACCOUNT_TYPE_LABELS,
  DEFAULT_CURRENCIES,
  LIABILITY_ACCOUNT_TYPES,
  type AccountType,
  type NewAccount,
} from '../types'
import { formatMoney, todayIso } from '../utils/dateRanges'
import { ConfirmDialog } from './ConfirmDialog'
import { InstitutionBadge } from './InstitutionBadge'
import { InstitutionPicker } from './InstitutionPicker'
import { categoriesForAccountType, findInstitution } from '../utils/institutions'
import type { AccountBalance } from '../utils/accountBalances'

const ACCOUNT_TYPES: AccountType[] = ['cash', 'bank', 'credit', 'ewallet', 'bnpl', 'loan', 'other']

const LOGO_PROMPTS: Partial<Record<AccountType, string>> = {
  bank: 'Choose a bank…',
  credit: 'Choose a card network…',
  ewallet: 'Choose an e-wallet…',
  bnpl: 'Choose a PayLater provider…',
  loan: 'Choose a lender…',
  other: 'Choose a logo…',
}

interface Props {
  balances: AccountBalance[]
  knownCurrencies: string[]
  onAdd: (account: NewAccount) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function AccountManager({ balances, knownCurrencies, onAdd, onDelete }: Props) {
  const currencyOptions = [...new Set([...knownCurrencies, ...DEFAULT_CURRENCIES])]
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('cash')
  const [currency, setCurrency] = useState(currencyOptions[0])
  const [startingBalance, setStartingBalance] = useState('0')
  const [institutionId, setInstitutionId] = useState<string | null>(null)
  const [pickingInstitution, setPickingInstitution] = useState(false)
  const [originalPrincipal, setOriginalPrincipal] = useState('')
  const [interestRate, setInterestRate] = useState('')
  const [monthlyPayment, setMonthlyPayment] = useState('')
  const [loanStartDate, setLoanStartDate] = useState(todayIso())
  const [loanTermMonths, setLoanTermMonths] = useState('')
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const selectedInstitution = findInstitution(institutionId)
  const relevantCategories = categoriesForAccountType(type)
  const isLiability = LIABILITY_ACCOUNT_TYPES.includes(type)

  function changeType(next: AccountType) {
    setType(next)
    const nextCategories = categoriesForAccountType(next)
    if (selectedInstitution && !nextCategories.includes(selectedInstitution.category)) {
      setInstitutionId(null)
    }
    if (next !== 'loan') {
      setOriginalPrincipal('')
      setInterestRate('')
      setMonthlyPayment('')
      setLoanTermMonths('')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      await onAdd({
        name: name.trim(),
        type,
        currency,
        startingBalance: Number(startingBalance) || 0,
        institutionId,
        originalPrincipal: type === 'loan' && originalPrincipal ? Number(originalPrincipal) : null,
        interestRate: type === 'loan' && interestRate ? Number(interestRate) : null,
        monthlyPayment: type === 'loan' && monthlyPayment ? Number(monthlyPayment) : null,
        loanStartDate: type === 'loan' && loanTermMonths ? loanStartDate : null,
        loanTermMonths: type === 'loan' && loanTermMonths ? Number(loanTermMonths) : null,
      })
      setName('')
      setStartingBalance('0')
      setInstitutionId(null)
      setOriginalPrincipal('')
      setInterestRate('')
      setMonthlyPayment('')
      setLoanStartDate(todayIso())
      setLoanTermMonths('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-ink-soft">Your accounts</h2>
        <ul className="space-y-2">
          {balances.map(({ account, balance }) => {
            const inst = findInstitution(account.institutionId)
            return (
              <li
                key={account.id}
                className="flex items-center justify-between rounded-xl border border-line px-3 py-2.5 text-sm"
              >
                <span className="flex items-center gap-2.5 text-ink-soft">
                  {inst ? (
                    <InstitutionBadge institution={inst} size="sm" />
                  ) : (
                    <span aria-hidden>{ACCOUNT_TYPE_ICONS[account.type]}</span>
                  )}
                  <span>
                    {account.name}
                    <span className="ml-1 text-xs text-ink-faint">({ACCOUNT_TYPE_LABELS[account.type]})</span>
                  </span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-ink">{formatMoney(balance, account.currency)}</span>
                  <button
                    onClick={() => setPendingDelete(account.id)}
                    aria-label={`Delete ${account.name}`}
                    className="text-ink-faint hover:text-red-400"
                  >
                    🗑
                  </button>
                </div>
              </li>
            )
          })}
          {balances.length === 0 && <p className="text-sm text-ink-faint">No accounts yet.</p>}
        </ul>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4">
        <div className="mb-3 flex items-center justify-between lg:hidden">
          <h2 className="text-sm font-medium text-ink-soft">Add an account</h2>
          <button
            onClick={() => setAdding((a) => !a)}
            className="text-xs font-medium text-emerald-500 hover:text-emerald-400"
          >
            {adding ? 'Cancel' : '+ Add account'}
          </button>
        </div>
        <h2 className="mb-3 hidden text-sm font-medium text-ink-soft lg:block">Add an account</h2>

        <form onSubmit={handleSubmit} className={`space-y-3 ${adding ? '' : 'hidden lg:block'}`}>
          <input
            type="text"
            placeholder="Account name, e.g. Maybank Savings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <select
              value={type}
              onChange={(e) => changeType(e.target.value as AccountType)}
              className="flex-1 rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-emerald-500"
            >
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ACCOUNT_TYPE_ICONS[t]} {ACCOUNT_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-20 rounded-xl border border-line bg-base px-2 py-2.5 text-sm text-ink outline-none focus:border-emerald-500"
            >
              {currencyOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {relevantCategories.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-ink-soft">Logo (optional)</label>
              <button
                type="button"
                onClick={() => setPickingInstitution(true)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-base px-3 py-2.5 text-left text-sm text-ink hover:border-emerald-500"
              >
                {selectedInstitution ? (
                  <>
                    <InstitutionBadge institution={selectedInstitution} size="sm" />
                    {selectedInstitution.name}
                  </>
                ) : (
                  <span className="text-ink-faint">{LOGO_PROMPTS[type]}</span>
                )}
              </button>
            </div>
          )}

          {type === 'loan' && (
            <div className="space-y-3 rounded-xl border border-line bg-base p-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-ink-soft">Original principal (optional)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 50000"
                  value={originalPrincipal}
                  onChange={(e) => setOriginalPrincipal(e.target.value)}
                  className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
                />
                <p className="mt-1 text-[11px] text-ink-faint">Total amount originally borrowed — used to show payoff progress.</p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Interest rate % (optional)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 3.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Monthly payment (optional)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 850"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Start date</label>
                  <input
                    type="date"
                    value={loanStartDate}
                    onChange={(e) => setLoanStartDate(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Term, months (optional)</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="e.g. 60"
                    value={loanTermMonths}
                    onChange={(e) => setLoanTermMonths(e.target.value)}
                    className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-ink-soft">
              {isLiability ? 'Current balance owed' : 'Starting balance'}
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder={isLiability ? 'e.g. -45000' : '0'}
              value={startingBalance}
              onChange={(e) => setStartingBalance(e.target.value)}
              className="w-full rounded-xl border border-line bg-base px-3 py-2.5 text-sm text-ink placeholder-ink-faint outline-none focus:border-emerald-500"
            />
            {isLiability && (
              <p className="mt-1 text-[11px] text-ink-faint">Enter as a negative number — e.g. -45000 if you still owe RM45,000.</p>
            )}
          </div>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-400 disabled:opacity-50"
          >
            {saving ? 'Adding…' : 'Add account'}
          </button>
        </form>
      </div>

      {pickingInstitution && (
        <InstitutionPicker
          categories={relevantCategories}
          onSelect={(id) => {
            setInstitutionId(id)
            setPickingInstitution(false)
          }}
          onClose={() => setPickingInstitution(false)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete account?"
          message="Transactions already recorded against this account will keep their data but the account will no longer appear in pickers."
          confirmLabel="Delete"
          onConfirm={() => {
            onDelete(pendingDelete)
            setPendingDelete(null)
          }}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
