import type { NPCDefinition } from './types'

export const npcDefinitions = [
  {
    id: 'npc_eldamar',
    name: 'Eldamar',
    title: 'Mestre dos Registros',
    settlementId: 'terran',
    roles: ['questGiver', 'lore'],
    questIds: ['vs_astravel_first_contact'],
    portraitAssetId: 'npc.eldamar.portrait',
    dialogue: [
      'Há marcas recentes nos registros de Astravél. Não são tinta, nem fungo comum.',
      'Entre pela rota mais curta, observe o que despertou e retorne com provas.',
    ],
    status: 'CONTENT_DRAFT',
  },
] satisfies NPCDefinition[]
