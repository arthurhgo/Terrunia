import { AlertTriangle, ArrowRight, Cloud, RefreshCcw, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { BASE_LOCATION_ID } from '../../domain/terran/base'
import { useAuthStore } from '../../state/authStore'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'

const getLocationLabel = (locationId: string) => {
  if (locationId === BASE_LOCATION_ID) return 'Base do Terrírian'
  const city = content.terranLocations[locationId]
  if (city) return city.name
  const trail = content.trails.trail_astravel_entry.nodes.find((node) => node.id === locationId)
  if (trail) return trail.label
  if (locationId === FUNGAL_DUNGEON_ID) return 'Câmaras Fúngicas'
  return 'Terran'
}

export function CharacterAccessScreen() {
  const save = useGameStore((state) => state.save)
  const characterAccess = useGameStore((state) => state.characterAccess)
  const syncMode = useGameStore((state) => state.syncMode)
  const continueCharacter = useGameStore((state) => state.continueCharacter)
  const resetCampaign = useGameStore((state) => state.resetCampaign)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0)
  const [confirmation, setConfirmation] = useState('')
  const [resetting, setResetting] = useState(false)

  if (!save) return <Navigate to="/character/create" replace />
  if (characterAccess !== 'required') return <Navigate to="/" replace />

  const clanName = save.character.clan.clanId
    ? content.clans[save.character.clan.clanId]?.name ?? save.character.clan.clanId
    : 'Sem Clã'
  const className = save.character.classProgression.classId
    ? content.classes[save.character.classProgression.classId]?.name ?? save.character.classProgression.classId
    : 'Sem Classe'
  const accountLabel = user?.email ?? user?.displayName ?? (user?.isGuest ? 'Convidado local' : save.ownerId)
  const savedAt = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    .format(new Date(save.updatedAt))

  const continueJourney = () => {
    continueCharacter()
    navigate('/', { replace: true })
  }
  const closeReset = () => {
    if (resetting) return
    setResetStep(0)
    setConfirmation('')
  }
  const createAnother = async () => {
    if (confirmation !== 'RESETAR') return
    setResetting(true)
    const completed = await resetCampaign()
    setResetting(false)
    if (completed) navigate('/character/create', { replace: true })
  }

  return (
    <main className="character-access-screen">
      <div className="character-access-screen__atmosphere" aria-hidden="true" />
      <section className="character-access-copy">
        <img src="/assets/ui/terrunia-mark.svg" alt="" />
        <p className="eyebrow">CONTA RECONHECIDA · PERSONAGEM ÚNICO</p>
        <h1>Retornar ao Nexo</h1>
        <p>Esta conta possui um Terrírian ativo. Continue a campanha salva ou encerre esta geração para criar uma nova identidade.</p>
        <div className="character-account-seal">
          <ShieldCheck size={18} />
          <span><small>VINCULADO À CONTA</small><strong>{accountLabel}</strong></span>
        </div>
      </section>

      <ArcanePanel title={save.character.name} eyebrow="TERRÍRIAN SALVO" className="character-access-panel">
        <div className="character-access-identity">
          <div className="character-access-portrait">
            <AssetImage assetId={save.character.portraitAssetId} />
            <span>NÍVEL {save.character.level}</span>
          </div>
          <div className="character-access-summary">
            <p className="eyebrow">IDENTIDADE ATIVA</p>
            <strong className="character-access-name">{save.character.name}</strong>
            <div className="character-access-tags"><span>{clanName}</span><span>{className}</span></div>
            <dl>
              <div><dt>Local atual</dt><dd>{getLocationLabel(save.world.currentLocationId)}</dd></div>
              <div><dt>Último save</dt><dd>{savedAt}</dd></div>
              <div><dt>Persistência</dt><dd><Cloud size={13} /> {syncMode === 'cloud' ? 'Conta e nuvem' : 'Dispositivo local'}</dd></div>
              <div><dt>Campanha</dt><dd>Geração {save.campaignGeneration}</dd></div>
            </dl>
          </div>
        </div>
        <div className="character-access-actions">
          <GameButton variant="primary" full onClick={continueJourney}>
            Continuar com {save.character.name} <ArrowRight size={18} />
          </GameButton>
          <GameButton variant="ghost" full onClick={() => setResetStep(1)}>
            <RefreshCcw size={17} /> Criar outro Terrírian
          </GameButton>
        </div>
        <p className="character-access-rule"><UserRound size={15} /> Uma conta mantém somente um Terrírian ativo.</p>
      </ArcanePanel>

      <Modal open={resetStep === 1} onClose={closeReset} title="Criar outro Terrírian?" eyebrow="SUBSTITUIÇÃO DE PERSONAGEM" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={closeReset}>Manter personagem</GameButton><GameButton variant="danger" onClick={() => setResetStep(2)}>Continuar</GameButton></div>}>
        <div className="reset-warning"><AlertTriangle size={36} /><p>Para manter um único personagem por conta, a campanha de <strong>{save.character.name}</strong> será invalidada antes da nova criação.</p><strong>Clã, Classe, Vínculos, inventário, missões e descobertas não serão transferidos.</strong></div>
      </Modal>
      <Modal open={resetStep === 2} onClose={closeReset} title="Confirmar nova identidade" eyebrow="CONFIRMAÇÃO FINAL" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={closeReset} disabled={resetting}>Cancelar</GameButton><GameButton variant="danger" disabled={confirmation !== 'RESETAR' || resetting} onClick={createAnother}>{resetting ? 'Preparando nova campanha…' : 'Criar outro personagem'}</GameButton></div>}>
        <label className="reset-confirmation-field"><span>Digite <strong>RESETAR</strong> para invalidar a campanha atual.</span><input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} autoFocus /></label>
      </Modal>
    </main>
  )
}
