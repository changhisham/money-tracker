import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../types'

// Dark-mode categorical palette (validated order, CVD-safe adjacent pairs).
const PALETTE = [
  '#3987e5', // blue
  '#d95926', // orange
  '#199e70', // aqua
  '#c98500', // yellow
  '#d55181', // magenta
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
]

const FALLBACK = '#6b7280' // neutral gray for categories beyond the fixed set

const ALL_CATEGORIES = [...new Set([...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES])]
const colorByCategory = new Map<string, string>(
  ALL_CATEGORIES.map((category, i) => [category, PALETTE[i % PALETTE.length]]),
)

export function categoryColor(category: string): string {
  return colorByCategory.get(category) ?? FALLBACK
}
