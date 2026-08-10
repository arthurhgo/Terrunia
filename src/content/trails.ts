import type { TrailDefinition } from './types'

export const trailDefinitions = [
  {
    id: 'trail_astravel_entry',
    name: 'Floresta de Astravél',
    regionId: 'astravel',
    actLabel: 'Prólogo — Entrada da Floresta',
    nodes: [
      { id: 'astravel_entry', index: 1, type: 'entry', label: 'Entrada' },
      {
        id: 'astravel_fungorro_01',
        index: 2,
        type: 'battle',
        label: 'Presença Fungorra',
        encounterId: 'encounter_fungorro_01',
        requiresQuestId: 'vs_astravel_first_contact',
      },
      { id: 'astravel_locked_03', index: 3, type: 'event', label: 'Rota desconhecida' },
      { id: 'astravel_boss_preview', index: 4, type: 'boss', label: 'Câmaras Fúngicas' },
    ],
    status: 'CONTENT_DRAFT',
  },
] satisfies TrailDefinition[]
