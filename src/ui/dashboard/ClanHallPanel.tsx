import { Award, BookOpenCheck, CheckCircle2, Sparkles, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { CLAN_SPELL_OPTIONS } from '../../content/clanSpells'
import { ROSETTA_CLAN_QUEST, getClanRecommendations } from '../../domain/progression/clanOrientation'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'
import { AssetImage } from '../components/AssetImage'
import { SocialQuestDialog } from './SocialQuestDialog'

const nextQuestFor=(questIds:readonly string[],save:GameSave)=>questIds.map(id=>save.quests[id])
  .find(progress=>progress&&progress.status!=='completed')

export function ClanHallPanel({save}:{save:GameSave}){
  const chooseCandidate=useGameStore(s=>s.chooseClanCandidate)
  const chooseSpell=useGameStore(s=>s.chooseInitialClanSpell)
  const joinClan=useGameStore(s=>s.joinClan)
  const unlockClass=useGameStore(s=>s.unlockClass)
  const [selectedQuestId,setSelectedQuestId]=useState<string|null>(null)
  const [confirmClanId,setConfirmClanId]=useState<string|null>(null)
  const [confirmClassId,setConfirmClassId]=useState<string|null>(null)
  const [confirmSkillId,setConfirmSkillId]=useState<string|null>(null)
  const joinedClan=save.character.clan.clanId?content.clans[save.character.clan.clanId]:null
  const eligibleClan=confirmClanId?content.clans[confirmClanId]:null
  const eligibleClass=confirmClassId?content.classes[confirmClassId]:null
  const oriented=save.character.level>=4&&save.quests[ROSETTA_CLAN_QUEST]?.status==='completed'
  const candidate=save.character.clan.candidateClanId
  const mainLore=save.quests.main_lore_identity_01
  const suggestions=getClanRecommendations(save,content)
  const pendingSkill=joinedClan&&save.character.clan.selectedClanSkillId===null
  return <>
    <ArcanePanel title="Recrutamento" eyebrow="CONHECER · PROVAR · PERTENCER" className="location-feature location-feature--clan clan-hall-progression">
      <div className="clan-state-banner"><UsersRound size={34}/><span>ESTADO DO PERSONAGEM
        <strong>{joinedClan?`${joinedClan.name} · Rank ${save.character.clan.rank} · Filiação única`:'Terrírian sem filiação'}</strong>
        <small>Classe: {save.character.classProgression.classId?content.classes[save.character.classProgression.classId]?.name:'ainda não desenvolvida'}</small>
      </span></div>
      {!joinedClan&&<p>{!oriented
        ? `Rosetta oferece Os Quatro Caminhos no nível 4. Nível atual: ${save.character.level}. Converse com ela na Praça do Portal, aceite a missão e retorne aqui.`
        : candidate?`Candidatura escolhida: ${content.clans[candidate]?.name}. Conclua as três provas em ondas com seu representante.`
          :'Agora escolha uma candidatura. Rosetta recomenda caminhos conforme sua arma, mas todas as opções são válidas.'}</p>}
      {!joinedClan&&<div className="clan-path-grid">{Object.values(content.clans).map(clan=>{
        const eligible=save.character.clan.eligibleClanIds.includes(clan.id)
        const nextQuest=nextQuestFor(clan.recruitmentQuestIds,save)
        const complete=clan.recruitmentQuestIds.filter(id=>save.quests[id]?.status==='completed').length
        const current=candidate===clan.id
        const advice=suggestions.find(c=>c.clanId===clan.id)
        return <article key={clan.id} className={eligible?'eligible':''}><Sparkles size={22}/>
          <h3>{clan.name}</h3><p>{clan.philosophy}</p>
          <small>{advice?.explanation}</small>
          <span className="clan-trial-progress">PROVAS <strong>{complete}/3</strong></span>
          {!oriented?<small>🔒 Primeiro conclua a missão de Rosetta no nível 4.</small>
            : !candidate?<GameButton variant="primary" onClick={()=>chooseCandidate(clan.id)}>Escolher candidatura</GameButton>
            : !current?<small>Outro caminho já escolhido. Seu juramento será único.</small>
            : eligible?<GameButton variant="primary" onClick={()=>setConfirmClanId(clan.id)}><Award size={16}/> Confirmar rito único</GameButton>
            : nextQuest?<GameButton variant="primary" onClick={()=>setSelectedQuestId(nextQuest.questId)}><BookOpenCheck size={16}/> {nextQuest.status==='available'?'Conversar com recrutador':nextQuest.status==='offered'?'Ler oferta':nextQuest.status==='active'?'Prosseguir nas ondas':'Entregar prova'}</GameButton>:null}
        </article>
      })}</div>}
      {joinedClan&&<section className="clan-joined-path">
        <strong>Clã atual: {joinedClan.name} — filiação única</strong>
        {pendingSkill?<div className="clan-skill-choices" aria-label="Escolha sua primeira magia de Clã">
          <h3>Escolha uma magia inicial (1 de 3)</h3>
          <p>As outras duas ficam reservadas à progressão futura. Confirme sua escolha.</p>
          <div className="clan-skill-choices__grid">{CLAN_SPELL_OPTIONS[joinedClan.id]?.map(skillId=>{
            const skill=content.combatSkills[skillId]
            return <button type="button" key={skillId} className="pixel-battle__skill-card"
              onClick={()=>setConfirmSkillId(skillId)}>
              <span className="pixel-battle__skill-icon"><AssetImage assetId={skill.iconAssetId??`skill.${skill.id}`} alt=""/></span>
              <strong className="pixel-battle__skill-name">{skill.name}</strong>
              <small className="pixel-battle__skill-cost">{skill.mpCost} MP · CD {skill.cooldownTurns}T</small>
              <small>{skill.description}</small>
            </button>
          })}</div>
        </div>:<small>Magia inicial: {content.combatSkills[save.character.clan.selectedClanSkillId??'']?.name??'Técnica histórica preservada'}</small>}
        <div className="class-path-grid">{joinedClan.classIds.map(classId=>{
          const cls=content.classes[classId],progress=save.quests[cls.trialQuestId]
          const eligible=save.character.classProgression.eligibleClassIds.includes(classId)
          const unlocked=save.character.classProgression.classId===classId
          return <article key={classId} className={eligible||unlocked?'eligible':''}><Award size={22}/>
            <h3>{cls.name}</h3><strong>{cls.role}</strong><p>“{cls.principle}”</p>
            {unlocked?<span className="path-unlocked"><CheckCircle2 size={16}/> CLASSE DESBLOQUEADA</span>
              : eligible?<GameButton variant="primary" onClick={()=>setConfirmClassId(classId)}>Assumir Classe</GameButton>
              : save.character.classProgression.classId?null:
              <GameButton variant="secondary" onClick={()=>setSelectedQuestId(progress.questId)}>{progress.status==='available'?'Conhecer prova':progress.status==='offered'?'Ler oferta':progress.status==='active'?'Realizar prova':'Concluir prova'}</GameButton>}
          </article>
        })}</div>
      </section>}
      {save.character.classProgression.classId&&mainLore&&mainLore.status!=='completed'&&
        <article className="main-lore-unlock"><Sparkles size={24}/><span><small>MAIN LORE ADAPTADA</small>
          <strong>Ecos da Identidade</strong><p>O Curador do Nexo preparou uma leitura moldada por seu Clã e Classe.</p></span>
          <GameButton variant="primary" onClick={()=>setSelectedQuestId(mainLore.questId)}>Consultar missão</GameButton>
        </article>}
    </ArcanePanel>
    <SocialQuestDialog questId={selectedQuestId} save={save} onClose={()=>setSelectedQuestId(null)}/>
    <Modal open={Boolean(eligibleClan)} onClose={()=>setConfirmClanId(null)}
      title={`Vínculo com ${eligibleClan?.name??''}`} eyebrow="RITO ÚNICO DE CLÃ"
      footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={()=>setConfirmClanId(null)}>Voltar</GameButton>
        <GameButton variant="primary" onClick={()=>{if(eligibleClan)joinClan(eligibleClan.id);setConfirmClanId(null)}}>Confirmar Clã permanentemente</GameButton></div>}>
      <p>Você poderá pertencer a apenas um Clã. Após o rito, não será possível trocar ou acumular filiações. Sua Classe continuará sendo desenvolvida posteriormente.</p>
    </Modal>
    <Modal open={Boolean(confirmSkillId)} onClose={()=>setConfirmSkillId(null)}
      title={content.combatSkills[confirmSkillId??'']?.name??'Escolha de magia'} eyebrow="UMA MAGIA INICIAL"
      footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={()=>setConfirmSkillId(null)}>Rever opções</GameButton>
        <GameButton variant="primary" onClick={()=>{if(confirmSkillId)chooseSpell(confirmSkillId);setConfirmSkillId(null)}}>Aprender esta magia</GameButton></div>}>
      <p>{content.combatSkills[confirmSkillId??'']?.description} A escolha é única nesta versão.</p>
    </Modal>
    <Modal open={Boolean(eligibleClass)} onClose={()=>setConfirmClassId(null)}
      title={`Assumir ${eligibleClass?.name??''}`} eyebrow="CONFIRMAÇÃO DE CLASSE"
      footer={<div className="quest-offer-actions"><GameButton variant="ghost" onClick={()=>setConfirmClassId(null)}>Ainda não</GameButton>
        <GameButton variant="primary" onClick={()=>{if(eligibleClass)unlockClass(eligibleClass.id);setConfirmClassId(null)}}>Desbloquear Classe</GameButton></div>}>
      <p>A prova foi concluída. Esta confirmação transforma a disciplina desenvolvida na Classe ativa.</p>
    </Modal>
  </>
}
