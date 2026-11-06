import type { QuestDefinition } from './types'

/**
 * CONTENT_DRAFT / BALANCE_DRAFT: optional three-step field study.
 * Each chapter asks for species obtainable from the current stage or its repeatable Portal hunt.
 * It never gates the main story, Clan/Class decisions or previously accepted missions.
 */
export const astravelProgressionQuests: QuestDefinition[] = [
  {
    id: 'side_astravel_spore_shells',
    title: 'A Primeira Carapaça',
    summary: 'Vorren precisa confirmar como os Cascos de Esporos resistem à passagem pela borda de Astravél. Enfrente dois e entregue suas observações.',
    contextNote: 'Onde encontrar: Acampamento Abandonado (marco 5) ou Caçada de Esporos no Portal. A missão não consome a quitina coletada.',
    giverNpcId: 'npc_vorren', turnInNpcId: 'npc_vorren', category: 'secondary',
    objectives: [{ id: 'spore_shells', type: 'kill', targetId: 'enemy_spore_bulwark', required: 2,
      label: 'Derrote 2 Cascos de Esporos em Astravél ou na Caçada do Portal' }],
    rewards: [{ type: 'characterXp', value: 35 }, { type: 'gold', value: 20 }, { type: 'rawEssence', value: 18 }],
    itemRewards: [{ itemId: 'consumable_antidote', quantity: 1 }],
    prerequisites: [{ type: 'questCompleted', questId: 'main_vorren_bestiary' }],
    initialStatus: 'locked',
    terranFlow: { active: 'location_terran_portal_plaza', ready_to_turn_in: 'location_terran_vorren_post' },
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'side_astravel_mycelial_tracking',
    title: 'Rastros sob o Micélio',
    summary: 'Daeryn quer compreender os perigos da trilha recuperada. Contenha dois Rastreadores Miceliais antes da próxima descida.',
    contextNote: 'Onde encontrar: Brejo Esporulante (marco 9) ou Rastro Micelial no Portal, liberado após o relato a Vorren.',
    giverNpcId: 'npc_daeryn', turnInNpcId: 'npc_daeryn', category: 'secondary',
    objectives: [{ id: 'mycelial_tracking', type: 'kill', targetId: 'enemy_mycelial_stalker', required: 2,
      label: 'Derrote 2 Rastreadores Miceliais em Astravél ou no Portal' }],
    rewards: [{ type: 'characterXp', value: 55 }, { type: 'gold', value: 35 }, { type: 'rawEssence', value: 35 }],
    itemRewards: [{ itemId: 'consumable_field_rune', quantity: 1 }],
    prerequisites: [
      { type: 'questCompleted', questId: 'main_astravel_lost_hunters' },
      { type: 'questCompleted', questId: 'side_astravel_spore_shells' },
    ],
    initialStatus: 'locked',
    terranFlow: { active: 'location_terran_portal_plaza', ready_to_turn_in: 'location_terran_daeryn_house' },
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'side_astravel_ruin_wardens',
    title: 'Vigias do Último Limiar',
    summary: 'Lithwynn solicita uma nova observação dos Vigias do Limiar após a investigação principal. Contenha dois ecos sem reabrir a derrota única do Colosso.',
    contextNote: 'Onde encontrar: Limiar da Ruína (marco 14) ou Guardiões do Limiar no Portal, liberados após entregar A Raiz da Corrupção.',
    giverNpcId: 'npc_lithwynn', turnInNpcId: 'npc_lithwynn', category: 'secondary',
    objectives: [{ id: 'ruin_wardens', type: 'kill', targetId: 'enemy_ruin_warden', required: 2,
      label: 'Derrote 2 Vigias do Limiar em Astravél ou na Caçada do Portal' }],
    rewards: [{ type: 'characterXp', value: 85 }, { type: 'gold', value: 52 }, { type: 'rawEssence', value: 60 }],
    itemRewards: [{ itemId: 'consumable_vital_essence', quantity: 1 }],
    prerequisites: [
      { type: 'questCompleted', questId: 'main_astravel_corruption' },
      { type: 'questCompleted', questId: 'side_astravel_mycelial_tracking' },
    ],
    initialStatus: 'locked',
    terranFlow: { active: 'location_terran_portal_plaza', ready_to_turn_in: 'location_terran_bond_workshop' },
    status: 'CONTENT_DRAFT',
  },
]
