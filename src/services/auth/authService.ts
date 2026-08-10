import type { Unsubscribe, User } from 'firebase/auth'
import { getFirebaseApp } from '../firebase/firebase'

export type AuthProfile = {
  uid: string
  displayName: string | null
  email: string | null
  photoURL: string | null
  isGuest: boolean
}

const DEVELOPMENT_GUEST_SESSION_KEY = 'terrunia.developmentGuest'

const hasDevelopmentGuestSession = () =>
  typeof sessionStorage !== 'undefined' &&
  sessionStorage.getItem(DEVELOPMENT_GUEST_SESSION_KEY) === 'active'

const toProfile = (user: User): AuthProfile => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
  isGuest: false,
})

export const observeAuth = (listener: (profile: AuthProfile | null) => void) => {
  let disposed = false
  let unsubscribe: Unsubscribe = () => undefined

  void (async () => {
    const app = await getFirebaseApp()
    if (!app) {
      if (!disposed) {
        listener(
          canUseDevelopmentGuest && hasDevelopmentGuestSession()
            ? getDevelopmentGuest()
            : null,
        )
      }
      return
    }
    const { getAuth, onAuthStateChanged } = await import('firebase/auth')
    if (disposed) return
    unsubscribe = onAuthStateChanged(getAuth(app), (user) => {
      const profile = user
        ? toProfile(user)
        : canUseDevelopmentGuest && hasDevelopmentGuestSession()
          ? getDevelopmentGuest()
          : null
      listener(profile)
    })
  })().catch(() => {
    if (!disposed) listener(null)
  })

  return () => {
    disposed = true
    unsubscribe()
  }
}

export const signInWithGoogle = async () => {
  const app = await getFirebaseApp()
  if (!app) throw new Error('Firebase ainda não foi configurado neste ambiente.')
  const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('firebase/auth')
  const result = await signInWithPopup(getAuth(app), new GoogleAuthProvider())
  return toProfile(result.user)
}

export const signOutFromFirebase = async () => {
  const app = await getFirebaseApp()
  if (app) {
    const { getAuth, signOut } = await import('firebase/auth')
    await signOut(getAuth(app))
  }
}

export const getDevelopmentGuest = (): AuthProfile => ({
  uid: 'dev-guest',
  displayName: 'Viajante local',
  email: null,
  photoURL: null,
  isGuest: true,
})

export const startDevelopmentGuestSession = () => {
  sessionStorage.setItem(DEVELOPMENT_GUEST_SESSION_KEY, 'active')
  return getDevelopmentGuest()
}

export const endDevelopmentGuestSession = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(DEVELOPMENT_GUEST_SESSION_KEY)
  }
}

export const canUseDevelopmentGuest =
  import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEV_GUEST !== 'false'
