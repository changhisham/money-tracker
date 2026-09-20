import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import type { Budget, Period } from '../types'

function budgetId(period: Period, currency: string, category?: string) {
  return category ? `${period}_${currency}_${category}` : `${period}_${currency}`
}

export function useBudgets(uid: string | undefined) {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setBudgets([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'users', uid, 'budgets'), (snapshot) => {
      setBudgets(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Budget, 'id'>) })))
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function setBudget(uid: string, period: Period, currency: string, amount: number, category?: string) {
    const id = budgetId(period, currency, category)
    const payload: Omit<Budget, 'id'> = category
      ? { period, currency, amount, category }
      : { period, currency, amount }
    await setDoc(doc(db, 'users', uid, 'budgets', id), payload)
  }

  async function deleteBudget(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'budgets', id))
  }

  return { budgets, loading, setBudget, deleteBudget }
}

export async function deleteAllBudgets(uid: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'budgets'))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
