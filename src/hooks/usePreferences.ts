import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import type { Preferences } from '../types'

const DOC_PATH = ['meta', 'preferences'] as const

type CategoryKind = 'customExpenseCategories' | 'customIncomeCategories'

export function usePreferences(uid: string | undefined) {
  const [preferences, setPreferences] = useState<Preferences>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPreferences({})
      setLoading(false)
      return
    }
    setLoading(true)
    const ref = doc(db, 'users', uid, ...DOC_PATH)
    const unsubscribe = onSnapshot(ref, (snap) => {
      setPreferences((snap.data() as Preferences | undefined) ?? {})
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function setDefaultCurrency(uid: string, currency: string) {
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { defaultCurrency: currency }, { merge: true })
  }

  async function setDisplayName(uid: string, name: string) {
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { displayName: name }, { merge: true })
  }

  async function addCustomCategory(uid: string, kind: CategoryKind, category: string) {
    const next = [...new Set([...(preferences[kind] ?? []), category])]
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { [kind]: next }, { merge: true })
  }

  async function removeCustomCategory(uid: string, kind: CategoryKind, category: string) {
    const next = (preferences[kind] ?? []).filter((c) => c !== category)
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { [kind]: next }, { merge: true })
  }

  async function setExchangeRate(uid: string, currency: string, rate: number) {
    const next = { ...(preferences.exchangeRates ?? {}), [currency]: rate }
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { exchangeRates: next }, { merge: true })
  }

  async function removeExchangeRate(uid: string, currency: string) {
    const next = { ...(preferences.exchangeRates ?? {}) }
    delete next[currency]
    await setDoc(doc(db, 'users', uid, ...DOC_PATH), { exchangeRates: next }, { merge: true })
  }

  return {
    preferences,
    loading,
    setDefaultCurrency,
    setDisplayName,
    addCustomCategory,
    removeCustomCategory,
    setExchangeRate,
    removeExchangeRate,
  }
}
