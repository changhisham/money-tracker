import { addMonths } from 'date-fns'
import { LIABILITY_ACCOUNT_TYPES } from '../types'
import type { Account } from '../types'
import type { AccountBalance } from './accountBalances'

export interface LoanDetail {
  account: Account
  /** How much is currently owed (always >= 0, even if the account balance is positive/overpaid). */
  outstanding: number
  /** Share of the original principal already paid off, 0-100. Null if no principal was set. */
  progressPct: number | null
  /** Estimated payoff date from loanStartDate + loanTermMonths, if both are set. */
  estimatedPayoffDate: Date | null
}

export function liabilityBalances(balances: AccountBalance[]): AccountBalance[] {
  return balances.filter((b) => LIABILITY_ACCOUNT_TYPES.includes(b.account.type))
}

export function loanDetail({ account, balance }: AccountBalance): LoanDetail {
  const outstanding = Math.max(-balance, 0)
  const progressPct =
    account.originalPrincipal && account.originalPrincipal > 0
      ? Math.min(Math.max(((account.originalPrincipal - outstanding) / account.originalPrincipal) * 100, 0), 100)
      : null
  const estimatedPayoffDate =
    account.loanStartDate && account.loanTermMonths
      ? addMonths(new Date(`${account.loanStartDate}T00:00:00`), account.loanTermMonths)
      : null

  return { account, outstanding, progressPct, estimatedPayoffDate }
}

export interface CurrencyTotal {
  currency: string
  total: number
}

/** Sum of original principal across loan accounts, grouped by currency. */
export function totalBorrowedByCurrency(accounts: Account[]): CurrencyTotal[] {
  const map = new Map<string, number>()
  for (const a of accounts) {
    if (a.type !== 'loan' || !a.originalPrincipal) continue
    map.set(a.currency, (map.get(a.currency) ?? 0) + a.originalPrincipal)
  }
  return [...map.entries()].map(([currency, total]) => ({ currency, total }))
}

/** Sum of currently-owed amounts across all liability accounts (loans + credit cards + BNPL), grouped by currency. */
export function totalOutstandingByCurrency(balances: AccountBalance[]): CurrencyTotal[] {
  const map = new Map<string, number>()
  for (const { account, balance } of liabilityBalances(balances)) {
    map.set(account.currency, (map.get(account.currency) ?? 0) + Math.max(-balance, 0))
  }
  return [...map.entries()].map(([currency, total]) => ({ currency, total }))
}
