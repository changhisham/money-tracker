import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import { applyPayment } from '../utils/debts'
import type { Debt, NewDebt } from '../types'

export function useDebts(uid: string | undefined) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setDebts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'users', uid, 'debts'), (snapshot) => {
      setDebts(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Debt, 'id'>) })))
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function addDebt(uid: string, debt: NewDebt) {
    await addDoc(collection(db, 'users', uid, 'debts'), { ...debt, createdAt: Date.now() })
  }

  async function updateDebt(uid: string, id: string, changes: Partial<NewDebt>) {
    await updateDoc(doc(db, 'users', uid, 'debts', id), changes)
  }

  async function deleteDebt(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'debts', id))
  }

  async function toggleDebtSettled(uid: string, debt: Debt) {
    await updateDoc(doc(db, 'users', uid, 'debts', debt.id), {
      settled: !debt.settled,
      settledAt: !debt.settled ? Date.now() : null,
    })
  }

  /** Logs a payment against a debt, auto-settling it once fully paid off. */
  async function recordPayment(uid: string, debt: Debt, amount: number, date: string, transactionId: string | null) {
    const changes = applyPayment(debt, amount, date, transactionId)
    await updateDoc(doc(db, 'users', uid, 'debts', debt.id), changes)
  }

  return { debts, loading, addDebt, updateDebt, deleteDebt, toggleDebtSettled, recordPayment }
}

export async function deleteAllDebts(uid: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'debts'))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
