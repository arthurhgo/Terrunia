import type { ItemDefinition, QuestDefinition } from './types'

/** OWNER_DECISION: ordinary starter armor is usable until the armor slot is permanently bound. */
export const basicArmorItems: ItemDefinition[] = [
  { id: 'equipment_worn_linen_tunic', name: 'Túnica de Linho Gasta', description: 'Pano remendado, pouca proteção. Rosetta entrega esta peça para você aprender a equipar pela mochila.',
    basicArmor: { tier: 1, mitigation: 1, initiative: 0, maxRefinement: 1 }, iconAssetId: 'item.worn-linen-tunic' },
  { id: 'equipment_apprentice_tunic', name: 'Túnica de Aprendiz', description: 'Uma túnica simples e leve: facilita o movimento, mas quase não protege.',
    basicArmor: { tier: 1, mitigation: 0, initiative: 1, maxRefinement: 1 }, iconAssetId: 'item.apprentice-tunic' },
  { id: 'equipment_light_leather_vest', name: 'Gibão de Couro Leve',
    description: 'Proteção inicial de couro leve: defesa melhor, mas exige mais tempo para agir. Visual provisório.',
    basicArmor: { tier: 1, mitigation: 2, initiative: -1, maxRefinement: 1 }, iconAssetId: 'item.simple-leather-armor' },
  { id: 'equipment_terran_guard_armor', name: 'Cota de Guarda de Terran',
    description: 'Proteção de treino avançada, acessível após a investigação dos Caçadores de Astravél. Visual provisório.',
    basicArmor: { tier: 3, mitigation: 3, initiative: -1, maxRefinement: 1 }, iconAssetId: 'item.simple-leather-armor' },
  { id: 'equipment_simple_leather_armor', name: 'Armadura de Couro Simples', description: 'Proteção comum vendida por Neris. Pode ser equipada e reforçada antes do Vínculo permanente da Armadura.',
    basicArmor: { tier: 2, mitigation: 2, initiative: 0, maxRefinement: 1 }, iconAssetId: 'item.simple-leather-armor' },
].map((item) => ({ ...item, category: 'equipment', rarity: 'common', convertToEssence: true, essenceValue: item.id === 'equipment_terran_guard_armor' ? 24 : item.id === 'equipment_simple_leather_armor' ? 16 : 8,
  sellable: true, sellValue: item.id === 'equipment_terran_guard_armor' ? 16 : item.id === 'equipment_simple_leather_armor' ? 9 : 3, questLocked: false, canInfuseBoundItem: false, combatEffects: [],
  affinityTags: ['starter', 'armor'], status: 'BALANCE_DRAFT' }))

/** Draft onboarding variants; higher tiers are acquired later, not interchangeable with permanent bonds. */
export const ROSETTA_STARTER_CHOICES = [
  'equipment_worn_linen_tunic',
  'equipment_apprentice_tunic',
  'equipment_light_leather_vest',
] as const

export const ARMOR_REFINEMENT = { gold: 8, itemId: 'material_linen_thread', quantity: 1, mitigationPerLevel: 1 } as const

const lessons: Omit<QuestDefinition, 'giverNpcId' | 'turnInNpcId' | 'category' | 'status'>[] = [
  { id: 'rosetta_tutorial_equip', title: 'Uma Primeira Proteção',
    summary: 'Conheça o Mercado de Terran e volte à Praça. Ao entregar a missão, escolha uma única proteção Tier I com Rosetta.',
    objectives: [{ id: 'visit_market', type: 'visit', targetId: 'location_terran_bond_workshop', required: 1, label: 'Visite o Mercado de Terran e retorne a Rosetta' }],
    choiceRewardItemIds: [...ROSETTA_STARTER_CHOICES],
    rewards: [{ type: 'characterXp', value: 5 }, { type: 'gold', value: 32 }],
    initialStatus: 'available', terranFlow: { active: 'location_terran_bond_workshop' } },
  { id: 'rosetta_tutorial_supply', title: 'Comprar para se Preparar',
    summary: 'Equipe a proteção Tier I escolhida, depois compre um Tônico de Campo com Neris no Mercado.'
    objectives: [
      { id: 'wear_armor', type: 'equip', targetId: 'basic_armor', required: 1, label: 'Equipe sua proteção escolhida na Mochila' },
      { id: 'buy_tonic', type: 'purchase', targetId: 'consumable_minor_tonic', required: 1, label: 'Compre um Tônico de Campo com Neris por 18 Ouro' },
    ],
    rewards: [{ type: 'characterXp', value: 5 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_equip' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_bond_workshop' } },
  { id: 'rosetta_tutorial_armor', title: 'Proteção para a Estrada (Opcional)',
    summary: 'Missão extra: experimente a Armadura de Couro Simples com Neris. Sua túnica inicial pode ser mantida e reforçada sem esta compra.',
    objectives: [{ id: 'buy_armor', type: 'purchase', targetId: 'equipment_simple_leather_armor', required: 1, label: 'Compre a Armadura de Couro Simples por 35 Ouro' },
      { id: 'wear_leather', type: 'equip', targetId: 'equipment_simple_leather_armor', required: 1, label: 'Equipe a Armadura de Couro Simples na mochila' }],
    rewards: [{ type: 'characterXp', value: 5 }, { type: 'gold', value: 4 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_refine' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_bond_workshop' } },
  { id: 'rosetta_tutorial_refine', title: 'O Primeiro Aprimoramento',
    summary: 'Leve uma proteção simples a Durnan. Use a linha entregue por Rosetta e 8 Ouro para reforçar a peça em +1.',
    objectives: [{ id: 'refine_armor', type: 'refine', targetId: 'basic_armor', required: 1, label: 'Aprimore uma armadura simples para +1 na Casa do Ferreiro' }],
    acceptanceItems: [{ itemId: 'material_linen_thread', quantity: 1 }],
    rewards: [{ type: 'characterXp', value: 10 }, { type: 'gold', value: 5 }],
    prerequisites: [{ type: 'questCompleted', questId: 'rosetta_tutorial_supply' }], initialStatus: 'locked',
    terranFlow: { active: 'location_terran_forge' } },
]

/** Keep legacy quest IDs and progress; leather is an optional detour, never a gate for refinement. */
export const ROSETTA_CORE_LESSON_IDS = ['rosetta_tutorial_equip', 'rosetta_tutorial_supply', 'rosetta_tutorial_refine'] as const

export const rosettaTutorialQuests: QuestDefinition[] = lessons.map((quest) => ({ ...quest, giverNpcId: 'npc_rosetta', turnInNpcId: 'npc_rosetta',
  category: quest.id === 'rosetta_tutorial_armor' ? 'secondary' : 'main',
  terranFlow: { ...quest.terranFlow, ready_to_turn_in: 'location_terran_portal_plaza' }, status: 'CONTENT_DRAFT' }))
