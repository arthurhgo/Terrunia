import { create } from 'zustand'
import {
  canUseDevelopmentGuest,
  endDevelopmentGuestSession,
  observeAuth,
  signInWithGoogle,
  signOutFromFirebase,
  startDevelopmentGuestSession,
  type AuthProfile,
} from '../services/auth/authService'

type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'error'

type AuthState = {
  status: AuthStatus
  user: AuthProfile | null
  error: string | null
  initialize: () => () => void
  loginGoogle: () => Promise<void>
  continueAsGuest: () => void
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  error: null,
  initialize: () =>
    observeAuth(
      (user) => {
        set({ status: user ? 'signedIn' : 'signedOut', user, error: null })
      },
      (error) => {
        set({
          status: 'error',
          user: null,
          error:
            error instanceof Error
              ? error.message
              : 'Falha ao preparar o perfil de nuvem.',
        })
      },
    ),
  loginGoogle: async () => {
    set({ status: 'loading', error: null })
    try {
      const user = await signInWithGoogle()
      set({ status: 'signedIn', user, error: null })
    } catch (error) {
      set({
        status: 'error',
        user: null,
        error: error instanceof Error ? error.message : 'Falha ao entrar com Google.',
      })
    }
  },
  continueAsGuest: () => {
    if (!canUseDevelopmentGuest) return
    set({ status: 'signedIn', user: startDevelopmentGuestSession(), error: null })
  },
  logout: async () => {
    endDevelopmentGuestSession()
    await signOutFromFirebase()
    set({ status: 'signedOut', user: null, error: null })
  },
}))
