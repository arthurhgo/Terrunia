import { Cloud, Database, ShieldCheck } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../state/authStore'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameShell } from '../components/GameShell'

export function SettingsScreen() {
  const save = useGameStore((state) => state.save)
  const syncMode = useGameStore((state) => state.syncMode)
  const syncStatus = useGameStore((state) => state.syncStatus)
  const user = useAuthStore((state) => state.user)
  if (!save) return <Navigate to="/character/create" replace />
  return (
    <GameShell>
      <div className="content-screen settings-screen">
        <header className="screen-heading"><p className="eyebrow">PERSISTÊNCIA E CONTA</p><h1>Configurações</h1><p>O progresso é salvo automaticamente após eventos críticos.</p></header>
        <div className="settings-grid">
          <ArcanePanel title="Save ativo" eyebrow="INDEXEDDB LOCAL-FIRST"><Database size={28} /><dl><div><dt>ID</dt><dd>{save.saveId.slice(0, 12)}…</dd></div><div><dt>Revisão</dt><dd>{save.revision}</dd></div><div><dt>Estado</dt><dd>{syncStatus}</dd></div></dl></ArcanePanel>
          <ArcanePanel title="Sincronização" eyebrow="FIRESTORE"><Cloud size={28} /><dl><div><dt>Modo</dt><dd>{syncMode ?? 'local'}</dd></div><div><dt>Usuário</dt><dd>{user?.isGuest ? 'Convidado local' : user?.displayName ?? 'Google'}</dd></div><div><dt>UID</dt><dd>{user?.uid}</dd></div></dl></ArcanePanel>
          <ArcanePanel title="Isolamento" eyebrow="SEGURANÇA"><ShieldCheck size={28} /><p>As regras Firestore permitem acesso somente quando <code>request.auth.uid == uid</code>.</p></ArcanePanel>
        </div>
        <p className="owner-decision-note"><strong>OWNER_DECISION:</strong> política final para conflitos simultâneos local/cloud. O draft atual escolhe a maior revisão e usa <code>updatedAt</code> como desempate.</p>
      </div>
    </GameShell>
  )
}
