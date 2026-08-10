import type { QuestDefinition } from './types'

export const questDefinitions = [
  {
    id: 'vs_astravel_first_contact',
    title: 'O Primeiro Rastro',
    summary: 'Investigue a entrada de Astravél e enfrente a presença Fungorra detectada por Eldamar.',
    giverNpcId: 'npc_eldamar',
    objectives: [
      { id: 'talk_eldamar', type: 'talk', targetId: 'npc_eldamar', required: 1 },
      { id: 'visit_astravel', type: 'visit', targetId: 'astravel_entry', required: 1 },
      { id: 'defeat_fungorro', type: 'kill', targetId: 'enemy_fungorro_crawler', required: 1 },
    ],
    rewards: [{ type: 'characterXp', value: 20 }],
    status: 'CONTENT_DRAFT',
  },
] satisfies QuestDefinition[]
