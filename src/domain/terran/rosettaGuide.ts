import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'
import type { GameSave } from '../game/types'
import { getActiveQuestCount } from '../quests/questEngine'
import { streetNpcPlacements } from '../../content/streetNpcs'

export type RosettaQuestHint = {
  id: string
  title: string
  npcName: string
  locationName: string
  instruction: string
}

const locationForNpc = (npcId: string, catalog: ContentCatalog) => {
  const location = Object.values(catalog.terranLocations).find((place) =>
    place.npcPresences.some((presence) => presence.npcId === npcId))
  if (location) return location.name
  const street = streetNpcPlacements.find((entry) => entry.npcId === npcId)
  if (street) return `Ruas de Terran · ${catalog.terranLocations[street.locationId]?.shortName ?? 'Centro'}`
  if (npcId.startsWith('npc_master_')) return 'Salão dos Clãs'
  return 'Ruas de Terran'
}

const hint = (quest: QuestDefinition, npcId: string, catalog: ContentCatalog, instruction: string): RosettaQuestHint => ({
  id: quest.id,
  title: quest.title,
  npcName: catalog.npcs[npcId]?.name ?? 'Responsável da missão',
  locationName: locationForNpc(npcId, catalog),
  instruction,
})

/** Read-only guide: only the actual quest journal decides eligibility and next objectives. */
export function getRosettaGuidance(save: GameSave, catalog: ContentCatalog) {
  const activeCount = getActiveQuestCount(save)
  const canReceive = true
  const definitions = Object.values(catalog.quests)
  const ready = definitions.filter((quest) => save.quests[quest.id]?.status === 'ready_to_turn_in')
  const active = definitions.filter((quest) => save.quests[quest.id]?.status === 'active')
  const offered = definitions.filter((quest) => ['available', 'offered'].includes(save.quests[quest.id]?.status ?? 'locked'))
    .sort((a, b) => Number(b.category === 'main') - Number(a.category === 'main'))

  const readyHints = ready.map((quest) =>
    hint(quest, quest.turnInNpcId, catalog, `Retorne a ${catalog.npcs[quest.turnInNpcId]?.name ?? 'quem recebeu sua missão'} para entregar.`))
  const activeHints = active.map((quest) => {
    const remaining = quest.objectives.find((objective) =>
      (save.quests[quest.id]?.objectives[objective.id] ?? 0) < objective.required)
    return hint(quest, quest.giverNpcId, catalog, remaining?.label ?? quest.summary)
  })
  const eligibleHints = offered.map((quest) => hint(quest, quest.giverNpcId, catalog,
    `Fale com ${catalog.npcs[quest.giverNpcId]?.name ?? 'o responsável'} para receber a missão.`))

  const next = readyHints[0] ?? activeHints[0] ??
    (canReceive ? eligibleHints[0] : undefined) ?? null

  return {
    next,
    available: eligibleHints,
    ready: readyHints,
    inProgress: activeHints,
    activeCount,
    maxActive: null,
    canReceive,
  }
}
