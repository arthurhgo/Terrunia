import type { FirebaseApp, FirebaseOptions } from 'firebase/app'

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasFirebaseConfig = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.length > 0,
)

// Automated tests must never connect to the live Firebase project loaded from .env.local.
export const isFirebaseConfigured = import.meta.env.MODE !== 'test' && hasFirebaseConfig

let appPromise: Promise<FirebaseApp | null> | null = null

export const getFirebaseApp = async () => {
  if (!isFirebaseConfigured) return null
  if (!appPromise) {
    appPromise = import('firebase/app').then(({ getApps, initializeApp }) =>
      getApps()[0] ?? initializeApp(firebaseConfig),
    )
  }
  return appPromise
}
