import { CheckCircle2, ClipboardList, Compass, Route, Shield } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getRosettaContextTipV0516 } from '../../domain/terran/rosettaContextV0516'
import { getRosettaGuidance } from '../../domain/terran/rosettaGuide'
import { getClanRecommendations, ROSETTA_CLAN_QUEST } from '../../domain/progression/clanOrientation'
import { DialogueWindow } from './DialogueWindow'
import { ROSETTA_CORE_LESSON_IDS, rosettaTutorialQuests } from '../../content/rosettaTutorial'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { QuestContextNote } from '../quests/QuestContextNote'
import './starterReward.css'

/** Rosetta teaches her own lessons; the player explicitly accepts and returns to claim rewards. */
export function RosettaGuide({ save, onClose, onOpenQuests, onOpenInventory, onShowPaths }: {
  save: GameSave
  onClose: () => void
  onOpenQuests: () => void
  onOpenInventory?: () => void
  onShowPaths?: () => void
}) {
  const offer = useGameStore((state) => state.offerQuest)
  const accept = useGameStore((state) => state.acceptQuest)
  const decline = useGameStore((state) => state.declineQuest)
  const complete = useGameStore((state) => state.turnInQuest)
  const [rewardChoice, setRewardChoice] = useState<string | null>(null)
  const guidance = getRosettaGuidance(save, content)
  const orientation = save.quests[ROSETTA_CLAN_QUEST]
  const recommendations = getClanRecommendations(save,content)
  const contextualTip = getRosettaContextTipV0516(save,content)
  const lesson = rosettaTutorialQuests.find((quest) => (ROSETTA_CORE_LESSON_IDS as readonly string[]).includes(quest.id) && ['available', 'offered', 'active', 'ready_to_turn_in'].includes(save.quests[quest.id]?.status))
  const progress = lesson ? save.quests[lesson.id] : null
  const nextObjective = lesson && progress?.status === 'active'
    ? lesson.objectives.find(objective => (progress.objectives[objective.id] ?? 0) < objective.required)
    : undefined
  const lessonIndex = lesson ? ROSETTA_CORE_LESSON_IDS.findIndex(id => id === lesson.id) + 1 : 0
  const marketTour=content.quests.rosetta_tutorial_market_specialists
  const marketTourProgress=save.quests.rosetta_tutorial_market_specialists
  const offered = progress && ['available', 'offered'].includes(progress.status)
  const otherOffers = guidance.available.filter((entry) => !(ROSETTA_CORE_LESSON_IDS as readonly string[]).includes(entry.id))
  return <DialogueWindow save={save} title="Rosetta" ariaLabel="Orientações de Rosetta" portraitAssetId="npc.rosetta.portrait" eyebrow="GUARDIÃ DO PORTAL"
    lines={content.npcs.npc_rosetta.dialogue} quest={lesson} onClose={onClose}>
    <div className="rosetta-guide__content">
      {contextualTip && <aside className="rosetta-guide__next" role="note" aria-label="Dica contextual de Rosetta">
        <strong>{contextualTip.title}</strong><p>{contextualTip.message}</p>
        <button type="button" onClick={contextualTip.destination==='inventory'&&onOpenInventory?onOpenInventory:onShowPaths??onOpenQuests}>{contextualTip.destination==='inventory'&&onOpenInventory?'Abrir mochila':'Ver orientação ou caminho'}</button>
      </aside>}
      {lesson && progress ? <section className="rosetta-tutorial" aria-label="Lição de Rosetta">
        <span className="eyebrow">TUTORIAL · LIÇÃO {lessonIndex} DE {ROSETTA_CORE_LESSON_IDS.length}</span>
        <h3>{lesson.title}</h3>
        {lesson.objectives.map((objective) => <p key={objective.id} className="rosetta-tutorial__objective"><CheckCircle2 size={14} /><span>{objective.label}</span><strong>{progress.objectives[objective.id] ?? 0}/{objective.required}</strong></p>)}
        {nextObjective && <div className="rosetta-guide__focus" role="status" aria-label="Próximo passo da lição" aria-live="polite">
          <strong>PRÓXIMO PASSO · {lessonIndex}/{ROSETTA_CORE_LESSON_IDS.length}</strong>
          <p>{nextObjective.label}</p>
          <small>Progresso: {progress.objectives[nextObjective.id]??0} de {nextObjective.required}</small>
          <button type="button" onClick={nextObjective.type==='equip'&&onOpenInventory
            ? onOpenInventory : onShowPaths??onOpenQuests}>
            {nextObjective.type==='equip'&&onOpenInventory?'Abrir mochila e equipar':'Ver caminho ou objetivo no Diário'}
          </button>
        </div>}
        <QuestContextNote note={lesson.contextNote} />
        {offered && lesson.acceptanceItems && <div className="rosetta-tutorial__gifts"><small>Você recebe ao aceitar</small>{lesson.acceptanceItems.map((input) => <span key={input.itemId}><AssetImage assetId={content.items[input.itemId].iconAssetId} />{input.quantity}× {content.items[input.itemId].name}</span>)}</div>}
        <small>Ao entregar: {lesson.rewards.map((reward) => `${reward.value} ${reward.type === 'gold' ? 'Ouro' : 'XP'}`).join(' · ')}
          {lesson.choiceRewardItemIds?.length ? ' · Escolha 1 proteção Tier I' : ''}</small>
        {progress.status === 'ready_to_turn_in' && Boolean(lesson.choiceRewardItemIds?.length) && <fieldset className="rosetta-reward-choice" aria-label="Escolha um equipamento inicial">
          <legend>Escolha somente 1 equipamento Tier I</legend>
          {lesson.choiceRewardItemIds?.map((itemId) => {
            const item = content.items[itemId]
            return <label key={itemId} className={rewardChoice === itemId ? 'is-selected' : ''}>
              <input type="radio" name="rosetta-starting-armor" checked={rewardChoice === itemId}
                onChange={() => setRewardChoice(itemId)} />
              <AssetImage assetId={item.iconAssetId} />
              <span><strong>{item.name}</strong><small>Tier {item.basicArmor?.tier} · Defesa {item.basicArmor?.mitigation} · Iniciativa {item.basicArmor?.initiative}</small>
                <small>{item.description}</small></span>
              <Shield size={17} aria-hidden="true" />
            </label>
          })}
        </fieldset>}
        <div className="rosetta-tutorial__actions">
          {offered && <><button type="button" onClick={() => { if (progress.status === 'offered') decline(lesson.id); onClose() }}>Agora não</button>
            <button type="button" className="rosetta-tutorial__accept" onClick={() => { if (progress.status === 'available') offer(lesson.id); accept(lesson.id) }}>Aceitar missão</button></>}
          {progress.status === 'active' && onOpenInventory && lesson.objectives.some((objective) => objective.type === 'equip') && <button type="button" onClick={onOpenInventory}>Abrir mochila</button>}
          {progress.status === 'ready_to_turn_in' && <button type="button" className="rosetta-tutorial__accept"
            disabled={Boolean(lesson.choiceRewardItemIds?.length) && !rewardChoice}
            onClick={() => complete(lesson.id, 'npc_rosetta', lesson.choiceRewardItemIds?.length ? rewardChoice ?? undefined : undefined)}>
            {lesson.choiceRewardItemIds?.length ? 'Receber equipamento escolhido' : 'Entregar lição'}
          </button>}
        </div>
      </section> : <p className="rosetta-tutorial__done"><CheckCircle2 size={16} /> As três lições principais foram concluídas. Sua proteção escolhida evolui com você; novas peças são opcionais.</p>}
      {marketTour && marketTourProgress && marketTourProgress.status!=='locked' && <article
        className="rosetta-guide__next" aria-label="Missão opcional dos mercadores de Terran">
        <h3><Compass size={16}/> {marketTour.title} · OPCIONAL</h3>
        <p>{marketTour.summary}</p>
        {marketTourProgress.status==='completed'
          ? <strong>Os três ofícios do Mercado já foram conhecidos. Missão concluída.</strong>
          : <div className="rosetta-tutorial">
            {marketTour.objectives.map(objective=><p key={objective.id} className="rosetta-tutorial__objective">
              <CheckCircle2 size={14}/><span>{objective.label}</span>
              <strong>{marketTourProgress.objectives[objective.id]??0}/{objective.required}</strong>
            </p>)}
            <div className="rosetta-tutorial__actions">
              {['available','offered'].includes(marketTourProgress.status)&&
                <button type="button" className="rosetta-tutorial__accept"
                  onClick={()=>{
                    if(marketTourProgress.status==='available')offer(marketTour.id)
                    accept(marketTour.id)
                  }}>Aceitar visita aos especialistas</button>}
              {marketTourProgress.status==='ready_to_turn_in'&&
                <button type="button" className="rosetta-tutorial__accept"
                  onClick={()=>complete(marketTour.id,'npc_rosetta')}>Concluir visita aos especialistas</button>}
              {marketTourProgress.status==='active'&&
                <small>Converse com os três especialistas no Mercado. Não precisa comprar nenhum item.</small>}
            </div>
          </div>}
      </article>}
      <article className="rosetta-guide__next" aria-label="Orientação de Clãs e arma vinculada">
        <h3><Compass size={16}/> Os Quatro Caminhos · Clã único</h3>
        <p>Rosetta apresenta Dûn'Avar (proteção), Rustal (runas), Cebios Esti (visão celestial) e Estres do Ét (fluxos instáveis). Só um Clã poderá receber seu juramento. Entre no Salão dos Clãs para encerrar a orientação; então aceite a missão da mesa diretamente com o líder de sua escolha.</p>
        <strong>Sinergia sugerida com {recommendations[0]?.weaponName ?? 'sua arma'}</strong>
        <div className="rosetta-clan-advice">{recommendations.map((clan,index)=><div key={clan.clanId}>
          <strong>{index===0?'★ Recomendação: ':''}{clan.name}</strong>
          <small>{clan.explanation}</small>
          <small>{clan.philosophy}</small>
        </div>)}</div>
        <small>Essas sugestões consideram bônus do catálogo. Qualquer arma pode ingressar em qualquer Clã. A decisão é sua.</small>
        {save.character.clan.clanId ? <strong>Filiação única: {content.clans[save.character.clan.clanId]?.name}</strong>
          : save.character.level<4 ? <small>🔒 Missão de Clã disponível no nível 4. Nível atual: {save.character.level}.</small>
          : orientation?.status==='completed' ? <strong>Orientação concluída. Aceite a primeira missão diretamente com um líder no Salão dos Clãs.</strong>
          : <div className="rosetta-tutorial__actions">
              {orientation?.status==='available' || orientation?.status==='offered' ?
                <button type="button" className="rosetta-tutorial__accept" onClick={()=>accept(ROSETTA_CLAN_QUEST)}>Aceitar “Os Quatro Caminhos”</button>
                : orientation?.status==='active' ? <button type="button" onClick={onShowPaths ?? onOpenQuests}>Mostrar caminho para o Salão dos Clãs</button>
                : orientation?.status==='ready_to_turn_in' ?
                  <strong>Entre novamente no Salão dos Clãs para registrar a orientação concluída.</strong>
                  : <small>Oriente-se com Rosetta para iniciar a missão.</small>}
            </div>}
      </article>
      {onShowPaths && <button type="button" className="rosetta-guide__paths" onClick={onShowPaths}><Route size={16} /> Mostrar caminhos dourados para novas missões</button>}
      {guidance.next && guidance.next.id !== lesson?.id && <article className="rosetta-guide__next">
        <h3><Compass size={16}/> O que fazer agora</h3>
          <strong>{guidance.next.title}</strong>
          <p>{guidance.next.instruction}</p>
          <small>Responsável: {guidance.next.npcName} · {guidance.next.locationName}</small>
      </article>}
      <article className="rosetta-guide__missions">
        <h3><ClipboardList size={16}/> Missões que pode receber</h3>
        <small>{guidance.activeCount} missões em andamento · sem limite</small>
        {!otherOffers.length && <p>Nenhuma outra missão está disponível pelos requisitos atuais.</p>}
        {otherOffers.length > 0 && <details><summary>Ver {otherOffers.length} ofertas pela cidade</summary>{otherOffers.map((entry) => <div key={entry.id} className="rosetta-guide__mission">
          <strong>{entry.title}</strong><span>Fale com {entry.npcName} · {entry.locationName}</span>
        </div>)}</details>}
        <button type="button" onClick={onOpenQuests}>Consultar diário de missões</button>
      </article>

    </div>
  </DialogueWindow>
}
