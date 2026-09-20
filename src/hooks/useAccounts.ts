import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, updateDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import type { Account, NewAccount } from '../types'

export function useAccounts(uid: string | undefined) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setAccounts([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'users', uid, 'accounts'), (snapshot) => {
      setAccounts(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Account, 'id'>) })))
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function addAccount(uid: string, account: NewAccount) {
    await addDoc(collection(db, 'users', uid, 'accounts'), { ...account, createdAt: Date.now() })
  }

  async function updateAccount(uid: string, id: string, account: Partial<NewAccount>) {
    await updateDoc(doc(db, 'users', uid, 'accounts', id), account)
  }

  async function deleteAccount(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'accounts', id))
  }

  return { accounts, loading, addAccount, updateAccount, deleteAccount }
}

export async function deleteAllAccounts(uid: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'accounts'))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
