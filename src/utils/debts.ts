import type { Debt, DebtPayment } from '../types'

export interface CurrencyTotal {
  currency: string
  amount: number
}

export function genPaymentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Sum of all payments logged against a debt. */
export function debtPaidAmount(debt: Debt): number {
  return (debt.payments ?? []).reduce((sum, p) => sum + p.amount, 0)
}

/** What's still owed on this debt — 0 if settled or fully paid off. */
export function debtRemaining(debt: Debt): number {
  if (debt.settled) return 0
  return Math.max(debt.amount - debtPaidAmount(debt), 0)
}

/** True if this debt still has money outstanding. */
export function isDebtOpen(debt: Debt): boolean {
  return debtRemaining(debt) > 0.005
}

/** Appends a payment and auto-settles the debt once it's fully paid off. */
export function applyPayment(
  debt: Debt,
  amount: number,
  date: string,
  transactionId: string | null,
): { payments: DebtPayment[]; settled: boolean; settledAt: number | null } {
  const payment: DebtPayment = { id: genPaymentId(), amount, date, createdAt: Date.now(), transactionId }
  const payments = [...(debt.payments ?? []), payment]
  const paid = payments.reduce((sum, p) => sum + p.amount, 0)
  const settled = paid >= debt.amount - 0.005
  return { payments, settled, settledAt: settled ? Date.now() : null }
}

function sumRemainingByCurrency(debts: Debt[]): CurrencyTotal[] {
  const map = new Map<string, number>()
  for (const d of debts) {
    map.set(d.currency, (map.get(d.currency) ?? 0) + debtRemaining(d))
  }
  return [...map.entries()].map(([currency, amount]) => ({ currency, amount }))
}

/** All debts involving a person, most recently started first. */
export function debtsForPerson(debts: Debt[], personId: string): Debt[] {
  return debts.filter((d) => d.personId === personId).sort((a, b) => (a.date < b.date ? 1 : -1))
}

/** What you currently owe across all friends, grouped by currency (open debts only). */
export function totalYouOwe(debts: Debt[]): CurrencyTotal[] {
  return sumRemainingByCurrency(debts.filter((d) => d.direction === 'i_owe' && isDebtOpen(d)))
}

/** Direct (non-split) money friends owe you, grouped by currency (open debts only). */
export function totalOwedToYouDirect(debts: Debt[]): CurrencyTotal[] {
  return sumRemainingByCurrency(debts.filter((d) => d.direction === 'owed_to_me' && isDebtOpen(d)))
}

export interface PersonDebtTotals {
  youOwe: CurrencyTotal[]
  owesYou: CurrencyTotal[]
}

export function personDebtTotals(debts: Debt[], personId: string): PersonDebtTotals {
  const mine = debts.filter((d) => d.personId === personId && isDebtOpen(d))
  return {
    youOwe: sumRemainingByCurrency(mine.filter((d) => d.direction === 'i_owe')),
    owesYou: sumRemainingByCurrency(mine.filter((d) => d.direction === 'owed_to_me')),
  }
}

/** Earliest date you've owed this person money continuously (oldest open debt you owe them). */
export function oldestUnsettledDate(debts: Debt[], personId: string): string | null {
  const open = debts.filter((d) => d.personId === personId && d.direction === 'i_owe' && isDebtOpen(d))
  if (open.length === 0) return null
  return open.reduce((earliest, d) => (d.date < earliest ? d.date : earliest), open[0].date)
}

export interface DueDebt {
  debt: Debt
  daysUntil: number
  overdue: boolean
}

/** Open debts with a due date, soonest/most-overdue first. */
export function debtsWithDueDates(debts: Debt[], withinDays = 9999): DueDebt[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return debts
    .filter((d) => isDebtOpen(d) && d.dueDate)
    .map((d) => {
      const due = new Date(`${d.dueDate}T00:00:00`)
      const daysUntil = Math.round((due.getTime() - today.getTime()) / 86_400_000)
      return { debt: d, daysUntil, overdue: daysUntil < 0 }
    })
    .filter((x) => x.daysUntil <= withinDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
}

/**
 * Converts currency totals into a single number using manual rates (units of `displayCurrency`
 * per 1 unit of the source currency). Currencies without a known rate are skipped; their
 * combined original amounts are returned separately so callers can disclose what was excluded.
 */
export function convertTotals(
  totals: CurrencyTotal[],
  displayCurrency: string,
  rates: Record<string, number> | undefined,
): { converted: number; skipped: CurrencyTotal[] } {
  let converted = 0
  const skipped: CurrencyTotal[] = []
  for (const t of totals) {
    if (t.currency === displayCurrency) {
      converted += t.amount
    } else if (rates?.[t.currency]) {
      converted += t.amount * rates[t.currency]
    } else {
      skipped.push(t)
    }
  }
  return { converted, skipped }
}
