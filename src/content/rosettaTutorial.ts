import type { ItemDefinition, QuestDefinition } from './types'

/** OWNER_DECISION: ordinary starter armor is usable until the armor slot is permanently bound. */
export const basicArmorItems: ItemDefinition[] = [
  { id: 'equipment_worn_linen_tunic', name: 'Túnica de Linho Gasta', description: 'Pano remendado, pouca proteção. Rosetta entrega esta peça para você aprender a equipar pela mochila.',
    basicArmor: { mitigation: 1, initiative: 0, maxRefinement: 1 }, iconAssetId: 'item.worn-linen-tunic' },
  { id: 'equipment_apprentice_tunic', name: 'Túnica de Aprendiz', description: 'Uma túnica simples e leve: facilita o movimento, mas quase não protege.',
    basicArmor: { mitigation: 0, initiative: 1, maxRefinement: 1 }, iconAssetId: 'item.apprentice-tunic' },
  { id: 'equipment_simple_leather_armor', name: 'Armadura de Couro Simples', description: 'Proteção comum vendida por Neris. Pode ser equipada e reforçada antes do Vínculo permanente da Armadura.',
    basicArmor: { mitigation: 2, initiative: 0, maxRefinement: 1 }, iconAssetId: 'item.simple-leather-armor' },
].map((item) => ({ ...item, category: 'equipment', rarity: 'common', convertToEssence: false, essenceValue: 0,
  sellable: false, sellValue: 0, questLocked: false, canInfuseBoundItem: false, combatEffects: [],
  affinityTags: ['starter', 'armor'], status: 'BALANCE_DRAFT' }))

export const ARMOR_REFINEMENT = { gold: 8, itemId: 'material_linen_thread', quantity: 1, mitigationPerLevel: 1 } as const

const lessons: Omit<QuestDefinition, 'giverNpcId' | 'turnInNpcId' | 'category' | 'status'>[] = [
  { id: 'rosetta_tutorial_equip', title: 'Uma Primeira Proteção',
    summary: 'Receba as duas túnicas de Rosetta, abra a mochila e equipe uma delas. A escolha é sua.',
    objectives: [{ id: 'wear_armor', type: 'equip', targetId: 'basic_armor', required: 1, label: 'Abra o Inventário e equipe uma túnica' }],
    acceptanceItems: [{ itemId: 'equipment_worn_linen_tunic', quantity: 1 }, { itemId: 'equipment_apprentice_tunic', quantity: 1 }],
    rewards: [{ type: 'characterXp', value: 10 }, { type: 'gold', value: 70 }],
    initialStatus: 'available', terranFlow: { active: 'location_terran_portal_plaza' } },
  { id: 'rosetta_tutorial_supply', title: 'Comprar para se Preparar',
    summary: 'Visite Neris no Mercado e compre um Tônico de Campo com parte do pagamento da primeira lição.',
    objectives: [{ id: 'buy_tonic', type: 'purchase', targetId: 'consumable_minor_tonic', required: 1, label: 'Compre um Tônico de Campo com Neris por 18 Ouro' }],
    rewards: [{ type: 'characterXp', value: 10 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_equip' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_bond_workshop' } },
  { id: 'rosetta_tutorial_armor', title: 'Proteção para a Estrada',
    summary: 'Compre uma Armadura de Couro Simples com Neris e equipe a proteção pela mochila.',
    objectives: [{ id: 'buy_armor', type: 'purchase', targetId: 'equipment_simple_leather_armor', required: 1, label: 'Compre a Armadura de Couro Simples por 35 Ouro' },
      { id: 'wear_leather', type: 'equip', targetId: 'equipment_simple_leather_armor', required: 1, label: 'Equipe a Armadura de Couro Simples na mochila' }],
    rewards: [{ type: 'characterXp', value: 15 }, { type: 'gold', value: 10 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_supply' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_bond_workshop' } },
  { id: 'rosetta_tutorial_refine', title: 'O Primeiro Aprimoramento',
    summary: 'Leve uma proteção simples a Durnan. Use a linha entregue por Rosetta e 8 Ouro para reforçar a peça em +1.',
    objectives: [{ id: 'refine_armor', type: 'refine', targetId: 'basic_armor', required: 1, label: 'Aprimore uma armadura simples para +1 na Casa do Ferreiro' }],
    acceptanceItems: [{ itemId: 'material_linen_thread', quantity: 1 }],
    rewards: [{ type: 'characterXp', value: 20 }, { type: 'gold', value: 10 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_armor' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_forge' } },
]

export const rosettaTutorialQuests: QuestDefinition[] = lessons.map((quest) => ({ ...quest, giverNpcId: 'npc_rosetta', turnInNpcId: 'npc_rosetta', category: 'main',
  terranFlow: { ...quest.terranFlow, ready_to_turn_in: 'location_terran_portal_plaza' }, status: 'CONTENT_DRAFT' }))
