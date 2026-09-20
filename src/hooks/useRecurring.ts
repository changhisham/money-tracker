import { useEffect, useRef } from 'react'
import { dueRecurringTransactions } from '../utils/recurring'
import type { NewTransaction, Transaction } from '../types'

/**
 * Catches up recurring transactions once per session: when the ledger has
 * loaded, generates any occurrences that fell due while the app was closed.
 */
export function useRecurring(
  uid: string | undefined,
  transactions: Transaction[],
  loading: boolean,
  addTransaction: (uid: string, transaction: NewTransaction) => Promise<void>,
) {
  const ranForUid = useRef<string | null>(null)

  useEffect(() => {
    if (!uid || loading || ranForUid.current === uid) return
    ranForUid.current = uid

    const due = dueRecurringTransactions(transactions)
    for (const transaction of due) {
      void addTransaction(uid, transaction)
    }
  }, [uid, transactions, loading, addTransaction])
}
