export const APP_VERSION = '1.0.0'

export type Period = 'weekly' | 'monthly' | 'yearly'

export type Recurrence = 'weekly' | 'monthly' | 'yearly'

export type TransactionType = 'expense' | 'income' | 'transfer'

export type AccountType = 'cash' | 'bank' | 'credit' | 'ewallet' | 'bnpl' | 'loan' | 'other'

/** Account types that represent money owed rather than money held — a negative balance means you owe that much. */
export const LIABILITY_ACCOUNT_TYPES: AccountType[] = ['credit', 'bnpl', 'loan']

export interface Account {
  id: string
  name: string
  type: AccountType
  currency: string
  /** For liability types, a negative balance means you currently owe that amount. */
  startingBalance: number
  createdAt: number
  archived?: boolean
  institutionId?: string | null
  /** Loan-only: total amount originally borrowed (fixed at origination). */
  originalPrincipal?: number | null
  /** Loan-only: annual interest rate, as a percentage (e.g. 3.5). Reference only. */
  interestRate?: number | null
  /** Loan-only: expected recurring installment amount. Reference only. */
  monthlyPayment?: number | null
  /** Loan-only: ISO date the loan started, used with loanTermMonths to estimate a payoff date. */
  loanStartDate?: string | null
  /** Loan-only: term length in months, used with loanStartDate to estimate a payoff date. */
  loanTermMonths?: number | null
}

export type NewAccount = Omit<Account, 'id' | 'createdAt'>

export interface Person {
  id: string
  name: string
  createdAt: number
}

export type NewPerson = Omit<Person, 'id' | 'createdAt'>

export interface SplitShare {
  personId: string
  amount: number
  settled: boolean
}

export interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: string
  accountId: string
  toAccountId?: string | null
  category?: string | null
  payee?: string | null
  tags?: string[] | null
  note: string
  date: string // ISO date (yyyy-MM-dd)
  createdAt: number
  recurrence?: Recurrence | null
  recurringGroupId?: string | null
  recurrenceEnd?: string | null // ISO date; series stops generating after this date
  excluded?: boolean
  splitWith?: SplitShare[] | null
}

export type NewTransaction = Omit<Transaction, 'id' | 'createdAt'>

export interface Budget {
  id: string // `${period}_${currency}` or `${period}_${currency}_${category}`
  period: Period
  currency: string
  amount: number
  category?: string
}

export type NewBudget = Omit<Budget, 'id'>

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Bills',
  'Shopping',
  'Entertainment',
  'Health',
  'Groceries',
  'Other',
] as const

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Gift',
  'Interest',
  'Investment',
  'Refund',
  'Other',
] as const

export const DEFAULT_CURRENCIES = ['MYR', 'USD', 'SGD', 'EUR', 'GBP', 'JPY', 'AUD'] as const

export const PERIOD_LABELS: Record<Period, string> = {
  weekly: 'Week',
  monthly: 'Month',
  yearly: 'Year',
}

export const RECURRENCE_LABELS: Record<Recurrence, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  bank: 'Bank',
  credit: 'Credit card',
  ewallet: 'E-wallet',
  bnpl: 'BNPL (PayLater)',
  loan: 'Loan',
  other: 'Other',
}

export const ACCOUNT_TYPE_ICONS: Record<AccountType, string> = {
  cash: '💵',
  bank: '🏦',
  credit: '💳',
  ewallet: '📱',
  bnpl: '🛍️',
  loan: '📉',
  other: '🗂️',
}

export interface Preferences {
  displayName?: string
  defaultCurrency?: string
  customExpenseCategories?: string[]
  customIncomeCategories?: string[]
}
