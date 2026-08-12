import type { QuestDefinition } from './types'

export const questDefinitions = [
  {
    id: 'vs_astravel_first_contact',
    title: 'O Primeiro Rastro',
    summary: 'Investigue a entrada de Astravél e enfrente a presença Fungorra detectada por Eldamar.',
    giverNpcId: 'npc_eldamar',
    turnInNpcId: 'npc_eldamar',
    category: 'main',
    objectives: [
      { id: 'talk_eldamar', type: 'talk', targetId: 'npc_eldamar', required: 1, label: 'Receba as instruções de Eldamar' },
      { id: 'visit_astravel', type: 'visit', targetId: 'astravel_entry', required: 1, label: 'Entre na rota de Astravél' },
      { id: 'defeat_fungorro', type: 'kill', targetId: 'enemy_fungorro_crawler', required: 1, label: 'Derrote um Fungorro Rastejante' },
    ],
    rewards: [{ type: 'characterXp', value: 20 }],
    terranFlow: {
      active: 'location_terran_portal_plaza',
      ready_to_turn_in: 'location_terran_eldamar_house',
    },
    status: 'CONTENT_DRAFT',
  },
] satisfies QuestDefinition[]
