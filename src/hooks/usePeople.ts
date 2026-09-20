import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { db } from '../firebase'
import type { NewPerson, Person } from '../types'

export function usePeople(uid: string | undefined) {
  const [people, setPeople] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!uid) {
      setPeople([])
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(collection(db, 'users', uid, 'people'), (snapshot) => {
      setPeople(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Person, 'id'>) })))
      setLoading(false)
    })
    return unsubscribe
  }, [uid])

  async function addPerson(uid: string, person: NewPerson) {
    const ref = await addDoc(collection(db, 'users', uid, 'people'), { ...person, createdAt: Date.now() })
    return ref.id
  }

  async function deletePerson(uid: string, id: string) {
    await deleteDoc(doc(db, 'users', uid, 'people', id))
  }

  return { people, loading, addPerson, deletePerson }
}

export async function deleteAllPeople(uid: string) {
  const snapshot = await getDocs(collection(db, 'users', uid, 'people'))
  await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)))
}
