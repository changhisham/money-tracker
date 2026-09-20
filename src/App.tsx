import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from './context/AuthContext'
import { LoginScreen } from './components/LoginScreen'
import { BottomNav } from './components/BottomNav'
import { Sidebar } from './components/Sidebar'
import { type Tab } from './components/navItems'
import { TransactionForm } from './components/TransactionForm'
import { BudgetSettings } from './components/BudgetSettings'
import { Dashboard } from './screens/Dashboard'
import { Settings } from './screens/Settings'
import { People } from './screens/People'
import { Accounts } from './screens/Accounts'
import { useTransactions } from './hooks/useTransactions'
import { useAccounts } from './hooks/useAccounts'
import { usePeople } from './hooks/usePeople'
import { useBudgets } from './hooks/useBudgets'
import { usePreferences } from './hooks/usePreferences'
import { useRecurring } from './hooks/useRecurring'
import { computeAccountBalances } from './utils/accountBalances'
import { toggleSplitSettled } from './utils/splits'
import { TransactionList } from './components/TransactionList'
import { DEFAULT_CURRENCIES } from './types'
import type { Transaction } from './types'

const TAB_WIDTH: Record<Tab, string> = {
  dashboard: 'max-w-6xl',
  add: 'max-w-5xl',
  accounts: 'max-w-6xl',
  budgets: 'max-w-6xl',
  people: 'max-w-6xl',
  settings: 'max-w-6xl',
}

function AuthedApp({ uid, email }: { uid: string; email: string | null }) {
  const { logOut } = useAuth()
  const [tab, setTab] = useState<Tab>('dashboard')
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const { transactions, loading: transactionsLoading, addTransaction, deleteTransaction, updateTransaction } =
    useTransactions(uid)
  const { accounts, loading: accountsLoading, addAccount, deleteAccount } = useAccounts(uid)
  const { people, addPerson, deletePerson } = usePeople(uid)
  const { budgets, setBudget, deleteBudget } = useBudgets(uid)
  const { preferences, setDefaultCurrency, setDisplayName, addCustomCategory, removeCustomCategory } =
    usePreferences(uid)
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
    dashboard: 'Dashboard',
    add: editingTransaction ? 'Edit transaction' : 'Add transaction',
    accounts: 'Accounts',
    budgets: 'Budgets',
    people: 'People',
    settings: 'Settings',
  }

  function openEdit(transaction: Transaction) {
    setEditingTransaction(transaction)
    setTab('add')
  }

  function changeTab(next: Tab) {
    if (next !== 'add') setEditingTransaction(null)
    setTab(next)
  }

  async function handleToggleSettled(transaction: Transaction, personId: string) {
    await updateTransaction(uid, transaction.id, { splitWith: toggleSplitSettled(transaction, personId) })
  }

  return (
    <div className="min-h-dvh bg-base">
      <Sidebar tab={tab} onChange={changeTab} name={displayName} email={email} onSignOut={() => logOut()} />

      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/95 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Money Tracker</p>
            <h1 className="text-xl font-semibold text-ink">{titles[tab]}</h1>
          </div>
        </header>

        <main className={`mx-auto px-4 py-5 pb-24 md:pb-8 ${TAB_WIDTH[tab]}`}>
          {tab === 'dashboard' && (
            <Dashboard
              transactions={transactions}
              accounts={accounts}
              budgets={budgets}
              name={displayName}
              email={email}
              onDelete={(id) => deleteTransaction(uid, id)}
              onEdit={openEdit}
              onAddTransaction={(values) => addTransaction(uid, values)}
            />
          )}
          {tab === 'add' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <TransactionForm
                accounts={accounts}
                people={people}
                knownExpenseCategories={knownExpenseCategories}
                knownIncomeCategories={knownIncomeCategories}
                initialValues={editingTransaction ?? undefined}
                onCancel={editingTransaction ? () => changeTab('dashboard') : undefined}
                onAddPerson={(name) => addPerson(uid, { name })}
                onSubmit={async (values) => {
                  if (editingTransaction) {
                    await updateTransaction(uid, editingTransaction.id, values)
                  } else {
                    await addTransaction(uid, values)
                  }
                  setEditingTransaction(null)
                  setTab('dashboard')
                }}
              />
              {transactions.length > 0 && (
                <div className="hidden lg:block">
                  <h2 className="mb-2 text-sm font-medium text-ink-soft">Recent transactions</h2>
                  <TransactionList
                    transactions={transactions.slice(0, 8)}
                    accounts={accounts}
                    onDelete={(id) => deleteTransaction(uid, id)}
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
              onDelete={(id) => deleteAccount(uid, id)}
            />
          )}
          {tab === 'budgets' && (
            <BudgetSettings
              budgets={budgets}
              knownCurrencies={knownCurrencies}
              knownCategories={knownExpenseCategories}
              onSave={(period, currency, amount, category) => setBudget(uid, period, currency, amount, category)}
              onDelete={(id) => deleteBudget(uid, id)}
            />
          )}
          {tab === 'people' && (
            <People
              people={people}
              transactions={transactions}
              onAddPerson={(name) => addPerson(uid, { name })}
              onDeletePerson={(id) => deletePerson(uid, id)}
              onToggleSettled={handleToggleSettled}
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
              onOpenAccounts={() => changeTab('accounts')}
            />
          )}
        </main>
      </div>

      <BottomNav tab={tab} onChange={changeTab} />
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
