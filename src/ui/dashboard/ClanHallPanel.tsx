import { Award, BookOpenCheck, CheckCircle2, Sparkles, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'
import { SocialQuestDialog } from './SocialQuestDialog'

const nextQuestFor = (questIds: readonly string[], save: GameSave) => questIds
  .map((questId) => save.quests[questId])
  .find((progress) => progress && progress.status !== 'completed')

export function ClanHallPanel({ save }: { save: GameSave }) {
  const discoverClan = useGameStore((state) => state.discoverClan)
  const joinClan = useGameStore((state) => state.joinClan)
  const unlockClass = useGameStore((state) => state.unlockClass)
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null)
  const [confirmClanId, setConfirmClanId] = useState<string | null>(null)
  const [confirmClassId, setConfirmClassId] = useState<string | null>(null)
  const joinedClan = save.character.clan.clanId ? content.clans[save.character.clan.clanId] : null
  const eligibleClan = confirmClanId ? content.clans[confirmClanId] : null
  const eligibleClass = confirmClassId ? content.classes[confirmClassId] : null
  const mainLore = save.quests.main_lore_identity_01

  return (
    <>
      <ArcanePanel title="Recrutamento" eyebrow="CONHECER · PROVAR · PERTENCER" className="location-feature location-feature--clan clan-hall-progression">
        <div className="clan-state-banner"><UsersRound size={34} /><span>ESTADO DO PERSONAGEM<strong>{joinedClan ? `${joinedClan.name} · Rank ${save.character.clan.rank}` : 'Terrírian sem filiação'}</strong><small>Classe: {save.character.classProgression.classId ? content.classes[save.character.classProgression.classId]?.name : 'ainda não desenvolvida'}</small></span></div>
        {!joinedClan ? <div className="clan-path-grid">{Object.values(content.clans).map((clan) => {
          const known = save.character.clan.knownClanIds.includes(clan.id)
          const eligible = save.character.clan.eligibleClanIds.includes(clan.id)
          const nextQuest = nextQuestFor(clan.recruitmentQuestIds, save)
          const complete = clan.recruitmentQuestIds.filter((id) => save.quests[id]?.status === 'completed').length
          return <article key={clan.id} className={eligible ? 'eligible' : ''}><Sparkles size={22} /><h3>{clan.name}</h3><p>{clan.philosophy}</p><span className="clan-trial-progress">PROVAS <strong>{complete}/3</strong></span>{!known ? <GameButton variant="secondary" onClick={() => discoverClan(clan.id)}>Conhecer representante</GameButton> : eligible ? <GameButton variant="primary" onClick={() => setConfirmClanId(clan.id)}><Award size={16} /> Aceitar o Vínculo</GameButton> : nextQuest ? <GameButton variant="primary" onClick={() => setSelectedQuestId(nextQuest.questId)}><BookOpenCheck size={16} /> {nextQuest.status === 'available' ? 'Conversar' : nextQuest.status === 'offered' ? 'Ler oferta' : nextQuest.status === 'active' ? 'Continuar prova' : 'Concluir prova'}</GameButton> : null}</article>
        })}</div> : <div className="class-path-grid">{joinedClan.classIds.map((classId) => {
          const classDefinition = content.classes[classId]
          const progress = save.quests[classDefinition.trialQuestId]
          const eligible = save.character.classProgression.eligibleClassIds.includes(classId)
          const unlocked = save.character.classProgression.classId === classId
          return <article key={classId} className={eligible || unlocked ? 'eligible' : ''}><Award size={22} /><h3>{classDefinition.name}</h3><strong>{classDefinition.role}</strong><p>“{classDefinition.principle}”</p>{unlocked ? <span className="path-unlocked"><CheckCircle2 size={16} /> CLASSE DESBLOQUEADA</span> : eligible ? <GameButton variant="primary" onClick={() => setConfirmClassId(classId)}>Assumir Classe</GameButton> : save.character.classProgression.classId ? null : <GameButton variant="secondary" onClick={() => setSelectedQuestId(progress.questId)}>{progress.status === 'available' ? 'Conhecer prova' : progress.status === 'offered' ? 'Ler oferta' : progress.status === 'active' ? 'Realizar prova' : 'Concluir prova'}</GameButton>}</article>
        })}</div>}
        {save.character.classProgression.classId && mainLore && mainLore.status !== 'completed' ? <article className="main-lore-unlock"><Sparkles size={24} /><span><small>MAIN LORE ADAPTADA</small><strong>Ecos da Identidade</strong><p>O Curador do Nexo preparou uma leitura moldada por seu Clã e sua Classe.</p></span><GameButton variant="primary" onClick={() => setSelectedQuestId(mainLore.questId)}>{mainLore.status === 'available' ? 'Conversar com o Curador' : mainLore.status === 'offered' ? 'Ler oferta' : mainLore.status === 'active' ? 'Interpretar eco' : 'Entregar missão'}</GameButton></article> : null}
      </ArcanePanel>
      <SocialQuestDialog questId={selectedQuestId} save={save} onClose={() => setSelectedQuestId(null)} />
      <Modal open={Boolean(eligibleClan)} onClose={() => setConfirmClanId(null)} title={`Vínculo com ${eligibleClan?.name ?? ''}`} eyebrow="CONFIRMAÇÃO DE CLÃ" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={() => setConfirmClanId(null)}>Ainda não</GameButton><GameButton variant="primary" onClick={() => { if (eligibleClan) joinClan(eligibleClan.id); setConfirmClanId(null) }}>Aceitar o Vínculo</GameButton></div>}><p>Ao aceitar, este Clã passará a fazer parte da identidade do personagem. Você desbloqueará progressão, bônus, três provas de Classe e novos caminhos.</p></Modal>
      <Modal open={Boolean(eligibleClass)} onClose={() => setConfirmClassId(null)} title={`Assumir ${eligibleClass?.name ?? ''}`} eyebrow="CONFIRMAÇÃO DE CLASSE" footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={() => setConfirmClassId(null)}>Ainda não</GameButton><GameButton variant="primary" onClick={() => { if (eligibleClass) unlockClass(eligibleClass.id); setConfirmClassId(null) }}>Desbloquear Classe</GameButton></div>}><p>A prova foi concluída. Esta confirmação transforma o caminho aprendido na Classe ativa do Terrírian.</p></Modal>
    </>
  )
}
