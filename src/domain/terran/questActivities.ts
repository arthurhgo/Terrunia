import type { GameSave } from '../game/types'

/** v0.25 — first playable object activities. Data is separate from room sprites.
 * No minigame grants items or makes a hypothesis canonical.
 */
export const questObjectActivities = {
  clan_dunavar_table_v05142: {
    locationId: 'location_terran_clan_hall', objectId: 'clan_initiation_table',
    title: "Mesa de Iniciação Dûn'Avar", kind: 'echo',
    solution: ['echo_character', 'echo_clan', 'echo_class'],
  },
  clan_rustal_table_v05142: {
    locationId: 'location_terran_clan_hall', objectId: 'clan_initiation_table',
    title: 'Mesa de Iniciação Rustal', kind: 'echo',
    solution: ['echo_character', 'echo_clan', 'echo_class'],
  },
  clan_cebios_esti_table_v05142: {
    locationId: 'location_terran_clan_hall', objectId: 'clan_initiation_table',
    title: 'Mesa de Iniciação Cebios Esti', kind: 'echo',
    solution: ['echo_character', 'echo_clan', 'echo_class'],
  },
  clan_estres_do_et_table_v05142: {
    locationId: 'location_terran_clan_hall', objectId: 'clan_initiation_table',
    title: 'Mesa de Iniciação Estres do Ét', kind: 'echo',
    solution: ['echo_character', 'echo_clan', 'echo_class'],
  },
  main_terran_first_home: {
    locationId: 'location_terran_daeryn_house',
    objectId: 'daeryn_healing_shelf',
    title: 'Organizar a Estante de Cura',
    kind: 'potions',
    solution: ['consumable_minor_tonic', 'consumable_simple_ether', 'consumable_antidote'],
  },
  main_vorren_bestiary: {
    locationId: 'location_terran_vorren_post',
    objectId: 'vorren_bestiary',
    title: 'Pesquisar o Bestiário de Vorren',
    kind: 'bookshelf',
    solution: ['book_fungorro', 'book_traces', 'book_fieldcare'],
  },
  main_lithwynn_signs: {
    locationId: 'location_terran_bond_workshop',
    objectId: 'bond_inscription_table',
    title: 'Investigar a Marca de Astravél',
    kind: 'inscription',
    solution: ['origin_astravel', 'pattern_irregular', 'record_uncertain'],
  },
  main_lore_identity_01: {
    locationId: 'location_terran_clan_hall',
    objectId: 'clan_echo_table',
    title: 'Interpretar os Ecos do Nexo',
    kind: 'echo',
    solution: ['echo_character', 'echo_clan', 'echo_class'],
  },
} as const

export type QuestObjectActivityId = keyof typeof questObjectActivities

export const isQuestObjectActivityId = (questId: string): questId is QuestObjectActivityId =>
  Object.prototype.hasOwnProperty.call(questObjectActivities, questId)

/** Exact object and ordered solution are required. No NPC "perform objective" shortcut. */
export function canCompleteQuestObjectActivity(
  save: GameSave, questId: string, objectId: string, steps: readonly string[],
): boolean {
  if (!isQuestObjectActivityId(questId)) return false
  const activity = questObjectActivities[questId]
  return !save.battle &&
    save.world.currentLocationId === activity.locationId &&
    save.quests[questId]?.status === 'active' &&
    objectId === activity.objectId &&
    steps.length === activity.solution.length &&
    activity.solution.every((part, i) => steps[i] === part)
}
