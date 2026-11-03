import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'
import type { GameSave } from '../game/types'
import { getActiveQuestCount } from '../quests/questEngine'
import { getPrioritizedQuestEntries } from '../quests/questSelectors'
import { streetNpcPlacements } from '../../content/streetNpcs'

export type RosettaQuestHint = {
  id: string
  title: string
  npcName: string
  locationName: string
  instruction: string
}

export const getRosettaNpcLocation = (npcId: string, catalog: ContentCatalog): string => {
  const location = Object.values(catalog.terranLocations).find((place) =>
    place.npcPresences.some((presence) => presence.npcId === npcId))
  if (location) return location.id
  const street = streetNpcPlacements.find((entry) => entry.npcId === npcId)
  if (street) return street.locationId
  if (npcId.startsWith('npc_master_')) return 'location_terran_clan_hall'
  return 'location_terran_portal_plaza'
}

const locationForNpc = (npcId: string, catalog: ContentCatalog) => {
  const id = getRosettaNpcLocation(npcId, catalog)
  const street = streetNpcPlacements.find((entry) => entry.npcId === npcId)
  return street ? `Ruas de Terran · ${catalog.terranLocations[id]?.shortName ?? 'Centro'}` : catalog.terranLocations[id]?.name ?? 'Ruas de Terran'
}

export type RosettaQuestRoute = {
  id: string; npcId: string | null; locationId: string; player: boolean
  questIds: string[]; titles: string[]
  /** Presentation metadata: an exclusively secondary destination stays blue in previews. */
  tone?: 'gold' | 'blue'
  opacity?: number
}

/** Every eligible main/secondary quest participates, even when it is not tracked. Shared destinations are coalesced. */
export function getRosettaQuestRoutes(save: GameSave, catalog: ContentCatalog): RosettaQuestRoute[] {
  const routes = new Map<string, RosettaQuestRoute>()
  for (const quest of Object.values(catalog.quests)) {
    if (!['main', 'secondary', 'bounty'].includes(quest.category)) continue
    const progress = save.quests[quest.id]
    if (!progress || !['available', 'offered', 'active', 'ready_to_turn_in'].includes(progress.status)) continue
    let npcId: string | null = progress.status === 'ready_to_turn_in' ? quest.turnInNpcId : quest.giverNpcId
    let locationId = getRosettaNpcLocation(npcId, catalog)
    let player = false
    if (progress.status === 'active') {
      const objective = quest.objectives.find((entry) => (progress.objectives[entry.id] ?? 0) < entry.required)
      npcId = null
      if (objective?.type === 'equip') player = true
      else if (objective?.type === 'purchase') { npcId = 'npc_neris'; locationId = 'location_terran_bond_workshop' }
      else if (objective?.type === 'refine') { npcId = 'npc_durnan'; locationId = 'location_terran_forge' }
      else if (objective?.type === 'talk' && catalog.npcs[objective.targetId]) { npcId = objective.targetId; locationId = getRosettaNpcLocation(npcId, catalog) }
      else locationId = quest.terranFlow?.active ?? 'location_terran_portal_plaza'
    }
    if (npcId === 'npc_rosetta') continue // Rosetta is already the origin of the guidance.
    const id = player ? 'player:inventory' : npcId ? `npc:${npcId}` : `location:${locationId}`
    const sideQuest = quest.category === 'secondary' || quest.category === 'bounty'
    const route = routes.get(id) ?? {
      id, npcId, locationId, player, questIds: [], titles: [],
      tone: sideQuest ? 'blue' as const : 'gold' as const, opacity: sideQuest ? 0.2 : 1,
    }
    // Shared main/side destinations are displayed as gold so main story is never suppressed.
    if (!sideQuest) { route.tone = 'gold'; route.opacity = 1 }
    route.questIds.push(quest.id); route.titles.push(quest.title)
    routes.set(id, route)
  }
  return [...routes.values()]
}

/** Exclusive tracked route: unlike Rosetta's discovery preview, this starts at the player
 * and resolves one accepted mission, including side quests, bounties and NPC delivery.
 * Equipment-only actions have no physical path.
 */
export type TrackedQuestRoute = RosettaQuestRoute & {
  questId: string
  tone: 'gold' | 'blue'
  opacity: number
}

export function getTrackedQuestRoute(save: GameSave, catalog: ContentCatalog): TrackedQuestRoute | null {
  const progress = Object.values(save.quests).find((entry) =>
    entry.tracked && ['active', 'ready_to_turn_in'].includes(entry.status))
  if (!progress) return null
  const quest = catalog.quests[progress.questId]
  if (!quest) return null

  let npcId: string | null = progress.status === 'ready_to_turn_in' ? quest.turnInNpcId : null
  let locationId = npcId ? getRosettaNpcLocation(npcId, catalog) : quest.terranFlow?.active
  if (progress.status === 'active') {
    const objective = quest.objectives.find((item) => (progress.objectives[item.id] ?? 0) < item.required)
    if (objective?.type === 'equip') return null
    if (objective?.type === 'talk' && catalog.npcs[objective.targetId]) {
      npcId = objective.targetId
      locationId = getRosettaNpcLocation(npcId, catalog)
    } else if (objective?.type === 'purchase') {
      npcId = 'npc_neris'
      locationId = 'location_terran_bond_workshop'
    } else if (objective?.type === 'refine') {
      npcId = 'npc_durnan'
      locationId = 'location_terran_forge'
    } else if (objective?.type === 'visit' && catalog.terranLocations[objective.targetId]) {
      locationId = objective.targetId
    } else if (objective?.type === 'kill' || objective?.type === 'collect') {
      // Portal is the verified access point for Astravél encounters/instanced loot.
      locationId = 'location_terran_portal_plaza'
    } else {
      locationId ??= getRosettaNpcLocation(quest.giverNpcId, catalog)
    }
  }
  if (!locationId || !catalog.terranLocations[locationId]) return null
  const blue = quest.category === 'secondary' || quest.category === 'bounty'
  return {
    id: `tracked:${quest.id}`,
    questId: quest.id,
    npcId,
    locationId,
    player: false,
    questIds: [quest.id],
    titles: [quest.title],
    tone: blue ? 'blue' : 'gold',
    opacity: blue ? 0.2 : 1,
  }
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
  const definitions = getPrioritizedQuestEntries(save, catalog).map(({ definition }) => definition)
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

  const first = definitions[0]
  const firstStatus = first && save.quests[first.id]?.status
  const next = first ? (firstStatus === 'ready_to_turn_in'
    ? readyHints.find((entry) => entry.id === first.id)
    : firstStatus === 'active' ? activeHints.find((entry) => entry.id === first.id)
      : eligibleHints.find((entry) => entry.id === first.id)) ?? null : null

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
