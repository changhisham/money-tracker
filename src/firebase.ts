import { initializeApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
)

// Only touch the Firebase SDK when real credentials are present — getAuth() throws
// synchronously on a missing/invalid API key, which would crash the app before
// LoginScreen ever gets a chance to show its "not configured" message.
let auth: Auth
let db: Firestore

if (firebaseConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
} else {
  auth = null as unknown as Auth
  db = null as unknown as Firestore
}

export { auth, db }
