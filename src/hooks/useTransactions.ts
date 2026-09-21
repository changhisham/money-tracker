import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import type { NewTransaction, Transaction } from '../types'

export function useTransactions(uid: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setTransactions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(collection(db, 'users', uid, 'transactions'), orderBy('date', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(
        snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transaction, 'id'>) })),
      )
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function addTransaction(uid: string, transaction: NewTransaction) {
    const ref = await addDoc(collection(db, 'users', uid, 'transactions'), {
      ...transaction,
      createdAt: Date.now(),
    })
    return ref.id
  }

  async function deleteTransaction(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'transactions', id))
  }

  async function updateTransaction(uid: string, id: string, transaction: Partial<NewTransaction>) {
    await updateDoc(doc(db, 'users', uid, 'transactions', id), transaction)
  }

  return { transactions, loading, addTransaction, deleteTransaction, updateTransaction }
}

export async function deleteAllTransactions(uid: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'transactions'))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
