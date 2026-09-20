import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'

const EXPENSE_ICONS: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Bills: '🧾',
  Shopping: '🛍️',
  Entertainment: '🎬',
  Health: '💊',
  Groceries: '🛒',
  Other: '📦',
}

const INCOME_ICONS: Record<string, string> = {
  Salary: '💼',
  Freelance: '💻',
  Business: '🏪',
  Gift: '🎁',
  Interest: '🏦',
  Investment: '📈',
  Refund: '↩️',
  Other: '📦',
}

const FALLBACK = '🏷️'

export function categoryIcon(category: string): string {
  return EXPENSE_ICONS[category] ?? INCOME_ICONS[category] ?? FALLBACK
}

export function isKnownExpenseCategory(category: string): boolean {
  return (DEFAULT_EXPENSE_CATEGORIES as readonly string[]).includes(category)
}

export function isKnownIncomeCategory(category: string): boolean {
  return (DEFAULT_INCOME_CATEGORIES as readonly string[]).includes(category)
}
