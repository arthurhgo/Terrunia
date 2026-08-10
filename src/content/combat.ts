import type {
  CombatSkillDefinition,
  EncounterDefinition,
  StatusEffectDefinition,
} from './types'

export const combatSkillDefinitions = [
  {
    id: 'skill_resonant_strike',
    name: 'Golpe Ressonante',
    description: 'Canaliza o primeiro node do Vínculo em um golpe que rompe a defesa do alvo.',
    target: 'enemy',
    mpCost: 3,
    effects: [
      { type: 'damage', powerBonus: 2 },
      { type: 'applyStatus', statusId: 'status_resonant_fracture', durationTurns: 2, chance: 1 },
    ],
    status: 'BALANCE_DRAFT',
  },
  {
    id: 'skill_spore_burst',
    name: 'Explosão de Esporos',
    description: 'Uma descarga fúngica que deixa esporos nocivos aderidos ao alvo.',
    target: 'enemy',
    mpCost: 0,
    effects: [
      { type: 'damage', powerBonus: 0 },
      { type: 'applyStatus', statusId: 'status_spore_poison', durationTurns: 2, chance: 1 },
    ],
    status: 'CONTENT_DRAFT',
  },
] satisfies CombatSkillDefinition[]

export const statusEffectDefinitions = [
  {
    id: 'status_resonant_fracture',
    name: 'Fratura Ressonante',
    description: 'A defesa foi desestabilizada pelo Vínculo.',
    tone: 'harmful',
    startTurnDamage: 0,
    attackModifier: 0,
    mitigationModifier: -1,
    status: 'BALANCE_DRAFT',
  },
  {
    id: 'status_spore_poison',
    name: 'Esporos Nocivos',
    description: 'Esporos aderidos causam dano no início do turno.',
    tone: 'harmful',
    startTurnDamage: 1,
    attackModifier: 0,
    mitigationModifier: 0,
    status: 'BALANCE_DRAFT',
  },
] satisfies StatusEffectDefinition[]

export const encounterDefinitions = [
  {
    id: 'encounter_fungorro_01',
    name: 'Primeira Presença Fungorra',
    trailNodeId: 'astravel_fungorro_01',
    enemyDefinitionIds: ['enemy_fungorro_crawler'],
    canFlee: false,
    rewards: {
      characterXp: 15,
      gold: 8,
      boundResonance: 12,
      lootDefinitionIds: ['drop_fungal_nucleus'],
    },
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'encounter_spore_ambush_01',
    name: 'Emboscada de Esporos',
    trailNodeId: 'astravel_spore_ambush_04',
    enemyDefinitionIds: [
      'enemy_fungorro_crawler',
      'enemy_spore_sower',
      'enemy_fungorro_crawler',
    ],
    canFlee: false,
    rewards: {
      characterXp: 55,
      gold: 20,
      boundResonance: 32,
      lootDefinitionIds: ['drop_spore_cluster'],
    },
    status: 'CONTENT_DRAFT',
  },
] satisfies EncounterDefinition[]
