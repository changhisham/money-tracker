import type { SplitShare, Transaction } from '../types'

/** Even shares for `count` other participants, remainder absorbed into your own share. */
export function equalShares(amount: number, count: number): number[] {
  if (count <= 0) return []
  const base = Math.floor((amount / (count + 1)) * 100) / 100
  return Array.from({ length: count }, () => base)
}

export function yourShare(amount: number, splitWith: SplitShare[]): number {
  const othersTotal = splitWith.reduce((sum, s) => sum + s.amount, 0)
  return Math.max(amount - othersTotal, 0)
}

export interface PersonOwed {
  personId: string
  byCurrency: { currency: string; amount: number }[]
}

/** Sums unsettled split shares per person, grouped by the transaction's currency. */
export function owedByPerson(transactions: Transaction[]): PersonOwed[] {
  const map = new Map<string, Map<string, number>>()

  for (const t of transactions) {
    if (t.type !== 'expense' || !t.splitWith) continue
    for (const share of t.splitWith) {
      if (share.settled) continue
      const byCurrency = map.get(share.personId) ?? new Map<string, number>()
      byCurrency.set(t.currency, (byCurrency.get(t.currency) ?? 0) + share.amount)
      map.set(share.personId, byCurrency)
    }
  }

  return [...map.entries()].map(([personId, byCurrency]) => ({
    personId,
    byCurrency: [...byCurrency.entries()].map(([currency, amount]) => ({ currency, amount })),
  }))
}

export function transactionsInvolvingPerson(transactions: Transaction[], personId: string): Transaction[] {
  return transactions.filter((t) => t.splitWith?.some((s) => s.personId === personId))
}

export function toggleSplitSettled(transaction: Transaction, personId: string): SplitShare[] {
  return (transaction.splitWith ?? []).map((s) => (s.personId === personId ? { ...s, settled: !s.settled } : s))
}
