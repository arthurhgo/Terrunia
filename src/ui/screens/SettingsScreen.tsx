import { AlertTriangle, Cloud, Database, RotateCcw, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../state/authStore'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'
import { Modal } from '../components/Modal'

export function SettingsScreen() {
  const save = useGameStore((state) => state.save)
  const syncMode = useGameStore((state) => state.syncMode)
  const syncStatus = useGameStore((state) => state.syncStatus)
  const resetCampaign = useGameStore((state) => state.resetCampaign)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [confirmation, setConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)
  if (!save) return <Navigate to="/character/create" replace />

  const closeReset = () => { if (!resetting) { setResetStep(0); setConfirmation('') } }
  const executeReset = async () => {
    if (confirmation !== 'RESETAR') return
    setResetting(true)
    const completed = await resetCampaign()
    setResetting(false)
    if (completed) navigate('/character/create', { replace: true })
  }

  return (
    <GameShell>
      <div className="content-screen settings-screen">
        <header className="screen-heading"><p className="eyebrow">PERSISTÊNCIA E CONTA</p><h1>Configurações</h1><p>O progresso é salvo automaticamente após eventos críticos.</p></header>
        <div className="settings-grid">
          <ArcanePanel title="Save ativo" eyebrow="INDEXEDDB LOCAL-FIRST"><Database size={28} /><dl><div><dt>ID</dt><dd>{save.saveId.slice(0, 12)}…</dd></div><div><dt>Campanha</dt><dd>{save.campaignId.slice(0, 12)}… · G{save.campaignGeneration}</dd></div><div><dt>Revisão</dt><dd>{save.revision}</dd></div><div><dt>Estado</dt><dd>{syncStatus}</dd></div></dl></ArcanePanel>
          <ArcanePanel title="Sincronização" eyebrow="FIRESTORE"><Cloud size={28} /><dl><div><dt>Modo</dt><dd>{syncMode ?? 'local'}</dd></div><div><dt>Usuário</dt><dd>{user?.isGuest ? 'Convidado local' : user?.displayName ?? 'Google'}</dd></div><div><dt>UID</dt><dd>{user?.uid}</dd></div></dl></ArcanePanel>
          <ArcanePanel title="Isolamento" eyebrow="SEGURANÇA"><ShieldCheck size={28} /><p>As regras Firestore permitem acesso somente quando <code>request.auth.uid == uid</code>.</p></ArcanePanel>
        </div>
        <ArcanePanel title="Conta e campanha" eyebrow="ZONA CRÍTICA" className="campaign-reset-panel">
          <div className="campaign-reset-copy"><RotateCcw size={30} /><span><strong>Resetar campanha</strong><p>Apaga o progresso do personagem no dispositivo e na nuvem. A Conta Google, o login e as preferências de interface permanecem.</p></span><GameButton variant="danger" onClick={() => setResetStep(1)}>Resetar campanha</GameButton></div>
        </ArcanePanel>
        <p className="owner-decision-note"><strong>OWNER_DECISION:</strong> política final para conflitos simultâneos local/cloud. O draft atual escolhe a maior revisão dentro da mesma geração de campanha.</p>
      </div>
      <Modal open={resetStep === 1} onClose={closeReset} title="Resetar campanha?" eyebrow="PRIMEIRA CONFIRMAÇÃO" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={closeReset}>Cancelar</GameButton><GameButton variant="danger" onClick={() => setResetStep(2)}>Continuar</GameButton></div>}>
        <div className="reset-warning"><AlertTriangle size={36} /><p>Todo o progresso deste personagem será apagado: Clã, Classe, Vínculos, Skill Trees, inventário, missões, campanha e descobertas.</p><strong>Sua conta continuará existindo.</strong></div>
      </Modal>
      <Modal open={resetStep === 2} onClose={closeReset} title="Esta ação não pode ser desfeita" eyebrow="CONFIRMAÇÃO FINAL" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={closeReset} disabled={resetting}>Cancelar</GameButton><GameButton variant="danger" disabled={confirmation !== 'RESETAR' || resetting} onClick={executeReset}>{resetting ? 'Resetando…' : 'Resetar campanha'}</GameButton></div>}>
        <label className="reset-confirmation-field"><span>Digite <strong>RESETAR</strong> para continuar.</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} /></label>
      </Modal>
    </GameShell>
  )
}
