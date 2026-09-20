import type { Account, Transaction } from '../types'

export interface AccountBalance {
  account: Account
  balance: number
}

export function computeAccountBalances(accounts: Account[], transactions: Transaction[]): AccountBalance[] {
  const balances = new Map(accounts.map((a) => [a.id, a.startingBalance]))

  for (const t of transactions) {
    if (t.type === 'income') {
      balances.set(t.accountId, (balances.get(t.accountId) ?? 0) + t.amount)
    } else if (t.type === 'expense') {
      balances.set(t.accountId, (balances.get(t.accountId) ?? 0) - t.amount)
    } else if (t.type === 'transfer') {
      balances.set(t.accountId, (balances.get(t.accountId) ?? 0) - t.amount)
      if (t.toAccountId) {
        balances.set(t.toAccountId, (balances.get(t.toAccountId) ?? 0) + t.amount)
      }
    }
  }

  return accounts.map((account) => ({ account, balance: balances.get(account.id) ?? account.startingBalance }))
}
