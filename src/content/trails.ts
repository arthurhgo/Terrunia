import type { TrailDefinition } from './types'

export const trailDefinitions = [
  {
    id: 'trail_astravel_entry',
    name: 'Floresta de Astravél',
    regionId: 'astravel',
    actLabel: 'Prólogo — Entrada da Floresta',
    nodes: [
      {
        id: 'astravel_entry',
        index: 1,
        type: 'entry',
        label: 'Entrada',
        position: { x: 18, y: 13 },
      },
      {
        id: 'astravel_fungorro_01',
        index: 2,
        type: 'battle',
        label: 'Presença Fungorra',
        actionLabel: 'Enfrentar Fungorro',
        encounterId: 'encounter_fungorro_01',
        requiresQuestId: 'vs_astravel_first_contact',
        position: { x: 48, y: 27 },
      },
      {
        id: 'astravel_camp_03',
        index: 3,
        type: 'camp',
        label: 'Acampamento Abandonado',
        position: { x: 31, y: 48 },
        interaction: {
          actionLabel: 'Vasculhar acampamento',
          completionMessage: 'Um Tônico de Campo foi preservado para o próximo encontro.',
          grantItemDefinitionIds: ['consumable_minor_tonic'],
          worldFlag: 'astravel_camp_supplies_found',
        },
      },
      {
        id: 'astravel_spore_ambush_04',
        index: 4,
        type: 'battle',
        label: 'Emboscada de Esporos',
        actionLabel: 'Emboscada de Esporos',
        encounterId: 'encounter_spore_ambush_01',
        position: { x: 64, y: 62 },
      },
      {
        id: 'astravel_ruin_threshold_05',
        index: 5,
        type: 'event',
        label: 'Limiar da Ruína',
        position: { x: 40, y: 79 },
        interaction: {
          actionLabel: 'Investigar o limiar',
          completionMessage: 'A entrada das Câmaras Fúngicas foi identificada, mas permanece selada.',
          grantItemDefinitionIds: [],
          worldFlag: 'fungal_chambers_threshold_discovered',
        },
      },
      {
        id: 'astravel_boss_preview',
        index: 6,
        type: 'boss',
        label: 'Câmaras Fúngicas',
        position: { x: 72, y: 88 },
      },
    ],
    status: 'CONTENT_DRAFT',
  },
] satisfies TrailDefinition[]
