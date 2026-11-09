import type { EncounterDefinition } from './types'

/** BALANCE_DRAFT: 3 waves per existing recruitment quest, enemy IDs registered in catalog. */
export const CLAN_TRIAL_WAVE_COUNT = 3 as const
export const CLAN_TRIALS = [
  {
    "id": "dunavar",
    "q": [
      "clan_dunavar_01",
      "clan_dunavar_02",
      "clan_dunavar_03"
    ],
    "f": [
      "enemy_fungorro_crawler",
      "enemy_spore_bulwark",
      "enemy_ruin_warden"
    ]
  },
  {
    "id": "rustal",
    "q": [
      "clan_rustal_01",
      "clan_rustal_02",
      "clan_rustal_03"
    ],
    "f": [
      "enemy_fungorro_crawler",
      "enemy_spore_sower",
      "enemy_ruin_sentinel"
    ]
  },
  {
    "id": "cebios_esti",
    "q": [
      "clan_cebios_01",
      "clan_cebios_02",
      "clan_cebios_03"
    ],
    "f": [
      "enemy_void_moth",
      "enemy_spore_sower",
      "enemy_mycelial_stalker"
    ]
  },
  {
    "id": "estres_do_et",
    "q": [
      "clan_estres_01",
      "clan_estres_02",
      "clan_estres_03"
    ],
    "f": [
      "enemy_spore_sower",
      "enemy_void_moth",
      "enemy_spore_bulwark"
    ]
  }
] as const
export const clanTrialEncounters: EncounterDefinition[] = CLAN_TRIALS.flatMap(clan =>
  clan.q.flatMap((questId, stage) => Array.from({length:CLAN_TRIAL_WAVE_COUNT},(_,wave) => ({
    id:`encounter_${questId}_wave_${wave+1}`,
    name:`Prova ${stage+1}: Onda ${wave+1}/${CLAN_TRIAL_WAVE_COUNT}`,
    locationLabel:'Salão dos Clãs · Prova de Admissão',
    victoryTitle:'Onda superada',victorySummary:'A avaliação continua no Salão dos Clãs.',
    trailNodeId:'location_terran_clan_hall',
    enemyDefinitionIds:[clan.f[(stage+wave)%3],clan.f[(stage+wave+1)%3]],
    canFlee:false,
    rewards:{characterXp:12+stage*6+wave*4,gold:4+wave*3,boundResonance:0,lootDefinitionIds:[]},
    status:'BALANCE_DRAFT' as const,
  }))))
/** Retain legacy 3×3 content for existing saves, but no longer offer it to new recruits. */
export const isLegacyClanTrialQuestId = (questId: string): boolean =>
  CLAN_TRIALS.some((clan) => (clan.q as readonly string[]).includes(questId))

export const clanTrialEncounterId = (questId:string,wave:number) =>
  `encounter_${questId}_wave_${wave}`
