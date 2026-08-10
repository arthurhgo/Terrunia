import { Cloud, LogIn, ShieldCheck, UserRound } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { canUseDevelopmentGuest } from '../../services/auth/authService'
import { isFirebaseConfigured } from '../../services/firebase/firebase'
import { useAuthStore } from '../../state/authStore'
import { GameButton } from '../components/GameButton'
import { LoadingScreen } from './LoadingScreen'

export function LoginScreen() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const error = useAuthStore((state) => state.error)
  const loginGoogle = useAuthStore((state) => state.loginGoogle)
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest)

  if (status === 'loading') return <LoadingScreen label="Reconhecendo sua assinatura…" />
  if (status === 'signedIn' && user) return <Navigate to="/" replace />

  return (
    <main className="login-screen">
      <div className="login-screen__atmosphere" aria-hidden="true" />
      <section className="login-card">
        <div className="login-card__seal">
          <img src="/assets/ui/terrunia-mark.svg" alt="" />
        </div>
        <p className="eyebrow">RPG DE PROGRESSÃO PERSISTENTE</p>
        <h1>Terrúnia</h1>
        <p className="login-card__subtitle">Resquícios das Ruínas</p>
        <p className="login-card__intro">
          Crie um Terrírian cru. Descubra seu Clã no mundo. Transforme cinco vínculos permanentes pela jornada.
        </p>

        <div className="login-card__principles">
          <span><ShieldCheck size={17} /> Equipamentos evoluem; não são trocados.</span>
          <span><Cloud size={17} /> Save local-first com sincronização autenticada.</span>
        </div>

        <div className="login-card__actions">
          <GameButton
            variant="primary"
            full
            onClick={() => void loginGoogle()}
            disabled={!isFirebaseConfigured}
          >
            <LogIn size={18} /> Entrar com Google
          </GameButton>
          {!isFirebaseConfigured && (
            <p className="field-hint">Configure o Firebase em <code>.env.local</code> para habilitar o login Google.</p>
          )}
          {canUseDevelopmentGuest && (
            <GameButton variant="ghost" full onClick={continueAsGuest}>
              <UserRound size={18} /> Continuar como convidado local
            </GameButton>
          )}
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <small className="login-card__security">Nenhuma senha Google é coletada pelo jogo.</small>
      </section>
    </main>
  )
}
