import type { DateRange } from './dateRanges'
import { isDateInRange, recentPeriods } from './dateRanges'
import type { Period, Transaction, TransactionType } from '../types'

export interface CurrencyTotal {
  currency: string
  total: number
}

export interface CategoryTotal {
  category: string
  total: number
}

export interface IncomeExpenseTotal {
  currency: string
  income: number
  expense: number
}

export function inRange(transactions: Transaction[], range: DateRange): Transaction[] {
  return transactions.filter((t) => isDateInRange(t.date, range))
}

export function totalsByCurrency(transactions: Transaction[], type: TransactionType = 'expense'): CurrencyTotal[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== type) continue
    map.set(t.currency, (map.get(t.currency) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([currency, total]) => ({ currency, total }))
    .sort((a, b) => b.total - a.total)
}

export function incomeExpenseByCurrency(transactions: Transaction[]): IncomeExpenseTotal[] {
  const map = new Map<string, { income: number; expense: number }>()
  for (const t of transactions) {
    if (t.type === 'transfer') continue
    const entry = map.get(t.currency) ?? { income: 0, expense: 0 }
    if (t.type === 'income') entry.income += t.amount
    else entry.expense += t.amount
    map.set(t.currency, entry)
  }
  return [...map.entries()]
    .map(([currency, { income, expense }]) => ({ currency, income, expense }))
    .sort((a, b) => b.expense + b.income - (a.expense + a.income))
}

export interface PeriodTotals {
  income: number
  expense: number
}

/** Income/expense totals for `count` recent periods (oldest first), for sparklines and trend %. */
export function periodSeries(
  transactions: Transaction[],
  period: Period,
  anchor: Date,
  count: number,
  currency: string,
): PeriodTotals[] {
  return recentPeriods(period, anchor, count).map((point) => {
    const bucket = inRange(transactions, point.range)
    const income = totalsByCurrency(bucket, 'income').find((t) => t.currency === currency)?.total ?? 0
    const expense = totalsByCurrency(bucket, 'expense').find((t) => t.currency === currency)?.total ?? 0
    return { income, expense }
  })
}

export function totalsByCategory(
  transactions: Transaction[],
  currency: string,
  type: TransactionType = 'expense',
): CategoryTotal[] {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== type || t.currency !== currency || !t.category) continue
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
  }
  return [...map.entries()]
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total)
}
