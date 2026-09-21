import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import { useToast } from './context/ToastContext'
import { LoginScreen } from './components/LoginScreen'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { AddChooser } from './components/AddChooser'
import { type Tab } from './components/navItems'
import { TransactionForm } from './components/TransactionForm'
import { BudgetSettings } from './components/BudgetSettings'
import { Overview } from './screens/Overview'
import { Transactions } from './screens/Transactions'
import { Analytics } from './screens/Analytics'
import { Settings } from './screens/Settings'
import { People } from './screens/People'
import { Accounts } from './screens/Accounts'
import { Loans } from './screens/Loans'
import { TransactionList } from './components/TransactionList'
import { useTransactions } from './hooks/useTransactions'
import { useAccounts } from './hooks/useAccounts'
import { usePeople } from './hooks/usePeople'
import { useDebts } from './hooks/useDebts'
import { useBudgets } from './hooks/useBudgets'
import { usePreferences } from './hooks/usePreferences'
import { useRecurring } from './hooks/useRecurring'
import { computeAccountBalances } from './utils/accountBalances'
import { toggleSplitSettled } from './utils/splits'
import { DEFAULT_CURRENCIES } from './types'
import type { Debt, Transaction, TransactionType } from './types'

const TAB_WIDTH: Record<Tab, string> = {
  overview: 'max-w-6xl',
  transactions: 'max-w-4xl',
  analytics: 'max-w-6xl',
  add: 'max-w-5xl',
  accounts: 'max-w-6xl',
  loans: 'max-w-6xl',
  budgets: 'max-w-6xl',
  people: 'max-w-6xl',
  settings: 'max-w-6xl',
}

function AuthedApp({ uid, email }: { uid: string; email: string | null }) {
  const { logOut } = useAuth()
  const { showToast } = useToast()
  const [tab, setTab] = useState<Tab>('overview')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [presetType, setPresetType] = useState<TransactionType | null>(null)
  const [addChooserOpen, setAddChooserOpen] = useState(false)
  const { transactions, loading: transactionsLoading, addTransaction, deleteTransaction, updateTransaction } =
    useTransactions(uid)
  const { accounts, loading: accountsLoading, addAccount, deleteAccount } = useAccounts(uid)
  const { people, addPerson, deletePerson } = usePeople(uid)
  const { debts, addDebt, deleteDebt, toggleDebtSettled, recordPayment } = useDebts(uid)
  const { budgets, setBudget, deleteBudget } = useBudgets(uid)
  const {
    preferences,
    setDefaultCurrency,
    setDisplayName,
    addCustomCategory,
    removeCustomCategory,
    setExchangeRate,
    removeExchangeRate,
  } = usePreferences(uid)
  useRecurring(uid, transactions, transactionsLoading, addTransaction)

  const bootstrapped = useRef(false)
  useEffect(() => {
    if (accountsLoading || bootstrapped.current || accounts.length > 0) return
    bootstrapped.current = true
    void addAccount(uid, {
      name: 'Cash',
      type: 'cash',
      currency: preferences.defaultCurrency ?? DEFAULT_CURRENCIES[0],
      startingBalance: 0,
    })
  }, [uid, accounts.length, accountsLoading, preferences.defaultCurrency, addAccount])

  const emailPrefix = email?.split('@')[0] ?? 'there'
  const displayName = preferences.displayName || emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)

  const knownExpenseCategories = useMemo(
    () => [
      ...new Set([
        ...transactions.filter((t) => t.type === 'expense' && t.category).map((t) => t.category!),
        ...(preferences.customExpenseCategories ?? []),
      ]),
    ],
    [transactions, preferences.customExpenseCategories],
  )
  const knownIncomeCategories = useMemo(
    () => [
      ...new Set([
        ...transactions.filter((t) => t.type === 'income' && t.category).map((t) => t.category!),
        ...(preferences.customIncomeCategories ?? []),
      ]),
    ],
    [transactions, preferences.customIncomeCategories],
  )
  const knownCurrencies = useMemo(() => {
    const set = new Set(accounts.map((a) => a.currency))
    return set.size > 0 ? [...set] : [DEFAULT_CURRENCIES[0]]
  }, [accounts])
  const accountBalances = useMemo(() => computeAccountBalances(accounts, transactions), [accounts, transactions])

  const titles: Record<Tab, string> = {
    overview: 'Overview',
    transactions: 'Transactions',
    analytics: 'Analytics',
    add: editingTransaction ? 'Edit transaction' : 'Add transaction',
    accounts: 'Accounts',
    loans: 'Loans & Credit',
    budgets: 'Budgets',
    people: 'People & Debts',
    settings: 'Settings',
  }

  function openEdit(transaction: Transaction) {
    setEditingTransaction(transaction)
    setPresetType(null)
    setTab('add')
  }

  function changeTab(next: Tab) {
    if (next !== 'add') setEditingTransaction(null)
    setTab(next)
  }

  function openAddChooser() {
    setAddChooserOpen(true)
  }

  function chooseType(type: TransactionType) {
    setEditingTransaction(null)
    setPresetType(type)
    setAddChooserOpen(false)
    setTab('add')
  }

  async function handleToggleSettled(transaction: Transaction, personId: string) {
    await updateTransaction(uid, transaction.id, { splitWith: toggleSplitSettled(transaction, personId) })
  }

  async function handleRecordPayment(debt: Debt, amount: number, date: string, accountId: string | null) {
    try {
      let transactionId: string | null = null
      if (accountId) {
        const person = people.find((p) => p.id === debt.personId)
        transactionId = await addTransaction(uid, {
          type: debt.direction === 'i_owe' ? 'expense' : 'income',
          amount,
          currency: debt.currency,
          accountId,
          toAccountId: null,
          category: 'Other',
          payee: person?.name ?? null,
          tags: null,
          note: `Debt ${debt.direction === 'i_owe' ? 'repayment to' : 'repayment from'} ${person?.name ?? 'friend'}${debt.note ? ` — ${debt.note}` : ''}`,
          date,
          recurrence: null,
          recurringGroupId: null,
          recurrenceEnd: null,
          excluded: false,
          splitWith: null,
        })
      }
      await recordPayment(uid, debt, amount, date, transactionId)
      showToast('Payment recorded')
    } catch {
      showToast('Unable to record payment. Please try again.', 'error')
    }
  }

  async function handleDeleteTransaction(id: string) {
    try {
      await deleteTransaction(uid, id)
      showToast('Transaction deleted')
    } catch {
      showToast('Unable to delete transaction. Please try again.', 'error')
    }
  }

  async function handleDeleteAccount(id: string) {
    try {
      await deleteAccount(uid, id)
      showToast('Account deleted')
    } catch {
      showToast('Unable to delete account. Please try again.', 'error')
    }
  }

  async function handleSaveBudget(
    period: Parameters<typeof setBudget>[1],
    currency: string,
    amount: number,
    category?: string,
  ) {
    try {
      await setBudget(uid, period, currency, amount, category)
      showToast('Budget updated')
    } catch {
      showToast('Unable to save budget. Please try again.', 'error')
    }
  }

  async function handleDeleteBudget(id: string) {
    try {
      await deleteBudget(uid, id)
      showToast('Budget deleted')
    } catch {
      showToast('Unable to delete budget. Please try again.', 'error')
    }
  }

  return (
    <div className="min-h-dvh bg-base">
      <Sidebar
        tab={tab}
        onChange={changeTab}
        onAddTransaction={openAddChooser}
        name={displayName}
        email={email}
        onSignOut={() => logOut()}
      />

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Money Tracker</p>
              <h1 className="text-xl font-semibold text-ink">{titles[tab]}</h1>
            </div>
            {tab !== 'add' && (
              <button
                onClick={openAddChooser}
                className="hidden shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 sm:flex"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Add transaction
              </button>
            )}
          </div>
        </header>

        <main className={`mx-auto px-4 py-5 pb-24 md:pb-8 ${TAB_WIDTH[tab]}`}>
          {tab === 'overview' && (
            <Overview
              transactions={transactions}
              accounts={accounts}
              budgets={budgets}
              people={people}
              debts={debts}
              name={displayName}
              email={email}
              onDelete={handleDeleteTransaction}
              onEdit={openEdit}
              onAddTransaction={(values) => addTransaction(uid, values)}
              onOpenPeople={() => changeTab('people')}
              onViewAllTransactions={() => changeTab('transactions')}
              onViewAnalytics={() => changeTab('analytics')}
            />
          )}
          {tab === 'transactions' && (
            <Transactions
              transactions={transactions}
              accounts={accounts}
              onDelete={handleDeleteTransaction}
              onEdit={openEdit}
            />
          )}
          {tab === 'analytics' && <Analytics transactions={transactions} accounts={accounts} budgets={budgets} />}
          {tab === 'add' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <TransactionForm
                accounts={accounts}
                people={people}
                knownExpenseCategories={knownExpenseCategories}
                knownIncomeCategories={knownIncomeCategories}
                initialValues={editingTransaction ?? undefined}
                initialType={presetType ?? undefined}
                onCancel={() => changeTab('overview')}
                onAddPerson={(name) => addPerson(uid, { name })}
                onSubmit={async (values) => {
                  try {
                    const wasEditing = Boolean(editingTransaction)
                    if (editingTransaction) {
                      await updateTransaction(uid, editingTransaction.id, values)
                    } else {
                      await addTransaction(uid, values)
                    }
                    setEditingTransaction(null)
                    setPresetType(null)
                    setTab('overview')
                    showToast(wasEditing ? 'Transaction updated' : 'Transaction added')
                  } catch {
                    showToast('Unable to save transaction. Please try again.', 'error')
                  }
                }}
              />
              {transactions.length > 0 && (
                <div className="hidden lg:block">
                  <h2 className="mb-2 text-sm font-medium text-ink-soft">Recent transactions</h2>
                  <TransactionList
                    transactions={transactions.slice(0, 8)}
                    accounts={accounts}
                    onDelete={handleDeleteTransaction}
                    onEdit={openEdit}
                  />
                </div>
              )}
            </div>
          )}
          {tab === 'accounts' && (
            <Accounts
              balances={accountBalances}
              knownCurrencies={knownCurrencies}
              onAdd={(account) => addAccount(uid, account)}
              onDelete={handleDeleteAccount}
            />
          )}
          {tab === 'loans' && <Loans accounts={accounts} balances={accountBalances} />}
          {tab === 'budgets' && (
            <BudgetSettings
              budgets={budgets}
              knownCurrencies={knownCurrencies}
              knownCategories={knownExpenseCategories}
              onSave={handleSaveBudget}
              onDelete={handleDeleteBudget}
            />
          )}
          {tab === 'people' && (
            <People
              people={people}
              transactions={transactions}
              debts={debts}
              accounts={accounts}
              knownCurrencies={knownCurrencies}
              preferences={preferences}
              onAddPerson={(name) => addPerson(uid, { name })}
              onDeletePerson={(id) => deletePerson(uid, id)}
              onToggleSettled={handleToggleSettled}
              onAddDebt={(debt) => addDebt(uid, debt)}
              onToggleDebtSettled={(debt) => toggleDebtSettled(uid, debt)}
              onDeleteDebt={(id) => deleteDebt(uid, id)}
              onRecordPayment={handleRecordPayment}
            />
          )}
          {tab === 'settings' && (
            <Settings
              uid={uid}
              email={email}
              name={displayName}
              knownCurrencies={knownCurrencies}
              preferences={preferences}
              stats={{ accounts: accounts.length, transactions: transactions.length, people: people.length }}
              onSetDisplayName={(name) => setDisplayName(uid, name)}
              onSetDefaultCurrency={(currency) => setDefaultCurrency(uid, currency)}
              onAddExpenseCategory={(category) => addCustomCategory(uid, 'customExpenseCategories', category)}
              onRemoveExpenseCategory={(category) => removeCustomCategory(uid, 'customExpenseCategories', category)}
              onAddIncomeCategory={(category) => addCustomCategory(uid, 'customIncomeCategories', category)}
              onRemoveIncomeCategory={(category) => removeCustomCategory(uid, 'customIncomeCategories', category)}
              onSetExchangeRate={(currency, rate) => setExchangeRate(uid, currency, rate)}
              onRemoveExchangeRate={(currency) => removeExchangeRate(uid, currency)}
              onOpenAccounts={() => changeTab('accounts')}
              onOpenLoans={() => changeTab('loans')}
            />
          )}
        </main>
      </div>

      <BottomNav tab={tab} onChange={changeTab} onAddTransaction={openAddChooser} />

      {addChooserOpen && <AddChooser onClose={() => setAddChooserOpen(false)} onChoose={chooseType} />}
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base text-ink-faint">
        Loading…
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <AuthedApp uid={user.uid} email={user.email} />
}

export default App
