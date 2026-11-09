/** v0.5.14.2: stable IDs shared by quests, room interactions and boss combat. */
export const CLAN_INITIATION_TABLE_ID = 'clan_initiation_table'
export const MAIN_CLAN_AFFILIATION_QUEST = 'main_clan_affiliation_v05142'
export const CLAN_AFFILIATION_RITE_ID = 'clan_affiliation_v05142'
export const GRANITE_GOLEM_ENEMY_ID = 'enemy_granite_golem'
export const GRANITE_GOLEM_ENCOUNTER_ID = 'encounter_clan_granite_golem_v05142'
export const clanTableQuestId = (clanId: string) => `clan_${clanId}_table_v05142`
export const clanGolemQuestId = (clanId: string) => `clan_${clanId}_granite_v05142`
