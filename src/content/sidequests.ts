import type { QuestDefinition, QuestPrerequisite } from './types'
import { npcDefinitions } from './npcs'
import { clanDefinitions, classDefinitions } from './progression'
import { streetQuestDefinitions } from './streetNpcs'

/**
 * CONTENT_DRAFT / BALANCE_DRAFT: secondary NPC contracts.
 * Uses existing Fungorro encounters (including repeatable Portal waves), not
 * invented creatures, fake objectives or automatic rewards.
 */
const names: Record<string, string> = {
  npc_eldamar: 'Fragmentos da Primeira Marca',
  npc_daeryn: 'Remédios para a Vigília',
  npc_sylwen: 'Esporos para o Alambique',
  npc_vorren: 'Rastros sob as Folhas',
  npc_lithwynn: 'As Inscrições Respirantes',
  npc_mireya_dunavar: 'Ronda da Barreira',
  npc_master_rustal: 'Traços Corrompidos',
  npc_observador_cebios: 'O Padrão dos Esporos',
  npc_guardador_estres: 'Contenção no Limiar',
  npc_curador_nexo: 'Memórias que Persistem',
  npc_master_sentinela: 'Uma Ronda Inquebrável',
  npc_master_gladiador: 'O Peso da Barreira',
  npc_master_batedor: 'Olhos na Trilha',
  npc_master_forjador: 'Marcas na Placa',
  npc_master_inscricoes: 'Glifos Sob Pressão',
  npc_master_gravador: 'A Runa Oculta',
  npc_master_astrologo: 'O Céu sobre Astravél',
  npc_master_profeta: 'Sinais do Próximo Ciclo',
  npc_master_cacador: 'A Constelação dos Caçadores',
  npc_master_canalizador: 'O Pulso Fora do Ritmo',
  npc_master_ruptura: 'Vigília da Fenda',
  npc_master_ruina: 'Ressonância da Praga',
}

const prerequisitesForNpc = (npcId: string): QuestPrerequisite[] => {
  const classOwner = classDefinitions.find((definition) => definition.masterNpcId === npcId)
  if (classOwner) return [{ type: 'clanJoined', clanId: classOwner.clanId }]
  const recruiter = clanDefinitions.find((definition) => definition.recruiterNpcId === npcId)
  if (recruiter) return [{ type: 'clanKnown', clanId: recruiter.id }]
  if (npcId === 'npc_curador_nexo') return [{ type: 'hasClass' }]
  const storyGate: Record<string, string> = {
    npc_daeryn: 'main_terran_first_home',
    npc_sylwen: 'main_terran_first_home',
    npc_vorren: 'main_vorren_bestiary',
    npc_lithwynn: 'main_lithwynn_signs',
  }
  return [{ type: 'questCompleted', questId: storyGate[npcId] ?? 'vs_astravel_first_contact' }]
}

const baseSideQuestDefinitions: QuestDefinition[] = npcDefinitions.filter((npc) => !npc.id.startsWith('npc_street_')).map((npc, index) => {
  const targetId = index % 3 === 0 ? 'enemy_spore_sower' : 'enemy_fungorro_crawler'
  const required = 2 + index % 3
  return {
    id: 'side_' + npc.id,
    title: names[npc.id] ?? 'O Pedido de ' + npc.name,
    summary: npc.name + ' pede ajuda para conter as manifestações Fungorras de Astravél. Recolha observações pela batalha e retorne para entregar o relatório.',
    giverNpcId: npc.id,
    turnInNpcId: npc.id,
    category: 'secondary',
    objectives: [{
      id: 'side_' + npc.id + '_combat',
      type: 'kill',
      targetId,
      required,
      label: 'Derrote ' + required + ' ' + (targetId === 'enemy_spore_sower' ? 'Semeadores de Esporos' : 'Fungorros Rastejantes') + ' em Astravél ou no Portal',
    }],
    rewards: [
      { type: 'characterXp', value: 20 + index * 4 },
      { type: 'gold', value: 10 + index * 2 },
      ...(index % 4 === 0 ? [{ type: 'rawEssence' as const, value: 15 + index }] : []),
    ],
    prerequisites: prerequisitesForNpc(npc.id),
    initialStatus: 'locked',
    status: 'CONTENT_DRAFT',
  }
})

export const sideQuestDefinitions: QuestDefinition[] = [
  ...baseSideQuestDefinitions,
  ...streetQuestDefinitions,
]
