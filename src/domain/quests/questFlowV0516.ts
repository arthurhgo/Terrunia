import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { ASTRAVEL_QUEST_CHAPTERS_V0516, currentQuestChapterV0516,
  isQuestOfferUnlockedV0516, questChapterV0516 } from './questPacingV0516'

/** CONTENT_DRAFT: narrative contacts, not new automatic quest or reward rules. */
export const ASTRAVEL_NARRATIVE_CHAIN_V0516 = [
  { completedQuestId: 'vs_astravel_first_contact', nextQuestId: 'main_astravel_lost_hunters',
    checkpoint: 'astravel_camp_03', checkpointLabel: 'Acampamento Abandonado · marco 5',
    context: 'Os vestígios do primeiro trecho apontam para os caçadores desaparecidos.' },
  { completedQuestId: 'main_astravel_lost_hunters', nextQuestId: 'main_astravel_corruption',
    checkpoint: 'astravel_hunter_refuge_10', checkpointLabel: 'Refúgio dos Caçadores · marco 10',
    context: 'Os relatos do Refúgio apontam para a origem da corrupção nas Ruínas.' },
] as const

export function getNarrativeLeadV0516(save: GameSave, catalog: ContentCatalog) {
  for (const link of ASTRAVEL_NARRATIVE_CHAIN_V0516) {
    if (save.quests[link.completedQuestId]?.status !== 'completed') continue
    const next = catalog.quests[link.nextQuestId]
    const status = save.quests[link.nextQuestId]?.status
    if (!next || !status || ['active', 'ready_to_turn_in', 'completed'].includes(status)) continue
    const checkpointReached = save.world.trailNodeStates[link.checkpoint] === 'completed'
    return { ...link, nextTitle: next.title,
      npcName: catalog.npcs[next.giverNpcId]?.name ?? 'o responsável',
      npcId: next.giverNpcId, canOffer: status === 'offered' ||
        (status === 'available' && isQuestOfferUnlockedV0516(save, next)),
      message: checkpointReached
        ? `${link.context} Procure ${catalog.npcs[next.giverNpcId]?.name ?? 'o responsável'} para receber “${next.title}”.`
        : `${link.context} Conclua ${link.checkpointLabel} e procure ${catalog.npcs[next.giverNpcId]?.name ?? 'o responsável'}.`,
    }
  }
  return null
}

/** Only show the next not-yet-unlocked offer that already meets its original
 * prerequisites. Never mark an NPC as an active quest giver prematurely. */
export function getNpcForeshadowV0516(save: GameSave, npcId: string, catalog: ContentCatalog) {
  const quest = Object.values(catalog.quests).find(definition => definition.giverNpcId === npcId &&
    save.quests[definition.id]?.status === 'available' &&
    !isQuestOfferUnlockedV0516(save, definition) &&
    questChapterV0516(definition) !== null)
  if (!quest) return null
  const chapter = questChapterV0516(quest)!
  const details = ASTRAVEL_QUEST_CHAPTERS_V0516[chapter]
  return { questId: quest.id, chapter: details.label,
    message: chapter === 'aftermath'
      ? 'Novos pedidos serão considerados após a conclusão de Astravél. Nenhuma missão foi aceita.'
      : `Uma investigação poderá ser iniciada após o marco ${details.from - 1}. Nenhuma missão foi aceita.` }
}

/** Read-only narrative evidence attached to REAL victory checkpoint IDs.
 * The player inspects it inside the route; completing the node is authoritative. */
export const ASTRAVEL_DISCOVERIES_V0516 = [
  { nodeId: 'astravel_moth_03', title: 'Pó das Mariposas',
    description: 'A poeira das asas se mistura aos esporos presos nas raízes. O contato entre as criaturas já é visível na Travessia.',
    relatedQuestId: 'side_astravel_thornback_signs' },
  { nodeId: 'astravel_camp_03', title: 'Placas no Acampamento',
    description: 'As placas deixadas pelos Cascos de Esporos testemunham a ocupação do abrigo. Vorren pode estudar esse registro.',
    relatedQuestId: 'side_astravel_spore_shells' },
  { nodeId: 'astravel_hunter_tracks_06', title: 'Emblema dos Caçadores',
    description: 'O emblema preso às raízes confirma que o grupo alcançou os Rastros. A busca de Vorren continua pelos próximos marcos.',
    relatedQuestId: 'main_astravel_lost_hunters' },
  { nodeId: 'astravel_spore_ambush_04', title: 'Sinais de Emboscada',
    description: 'A posição dos fungos e das raízes revela a rota da emboscada. O relatório ajuda a reconstituir a passagem dos caçadores.',
    relatedQuestId: 'main_astravel_lost_hunters' },
  { nodeId: 'astravel_horror_09', title: 'Vestígios no Micélio',
    description: 'Os filamentos deixados pelos Rastreadores no brejo permitem que Daeryn examine a contaminação sem exigir outra batalha.',
    relatedQuestId: 'side_astravel_mycelial_tracking' },
  { nodeId: 'astravel_hunter_refuge_10', title: 'Último Refúgio',
    description: 'O refúgio agora preserva o último registro da busca. Vorren deve receber o relatório antes da descida.',
    relatedQuestId: 'main_astravel_lost_hunters' },
  { nodeId: 'astravel_ruin_watch_11', title: 'Inscrições da Vigília',
    description: 'As marcas da Sentinela indicam que a corrupção chega às ruínas. Lithwynn pode interpretar esses traços.',
    relatedQuestId: 'main_astravel_corruption' },
  { nodeId: 'astravel_ruin_threshold_05', title: 'Marcas do Limiar',
    description: 'Os Vigias do Limiar guardavam as inscrições quebradas. O registro dessa vitória pode ser entregue a Lithwynn.',
    relatedQuestId: 'side_astravel_ruin_wardens' },
] as const

export function getRecordedDiscoveriesV0516(save: GameSave) {
  return ASTRAVEL_DISCOVERIES_V0516.filter(discovery =>
    save.world.trailNodeStates[discovery.nodeId] === 'completed')
}

/** The report reads current save facts; acquired/sold materials are not
 * confused with a lifetime loot history. This does not grant rewards. */
export function getExpeditionReportV0516(save: GameSave, catalog: ContentCatalog) {
  const trail = catalog.trails.trail_astravel_entry
  const nodes = trail.nodes.filter(node => node.type !== 'entry')
  const cleared = nodes.filter(node => save.world.trailNodeStates[node.id] === 'completed')
  const chapter = currentQuestChapterV0516(save)
  const deliveries = Object.values(save.quests).filter(progress =>
    progress.status === 'ready_to_turn_in' && catalog.quests[progress.questId])
    .map(progress => ({ questId: progress.questId,
      title: catalog.quests[progress.questId].title,
      npcName: catalog.npcs[catalog.quests[progress.questId].turnInNpcId]?.name ?? 'NPC responsável' }))
  const materials = save.inventory.filter(entry =>
    catalog.items[entry.definitionId]?.category === 'material' ||
    catalog.items[entry.definitionId]?.category === 'fragment' ||
    catalog.items[entry.definitionId]?.category === 'drop')
    .map(entry => ({ id: entry.instanceId, itemId: entry.definitionId, quantity: entry.quantity,
      name: catalog.items[entry.definitionId]?.name ?? entry.definitionId }))
  return { chapter, chapterName: ASTRAVEL_QUEST_CHAPTERS_V0516[chapter].label,
    completedEncounters: cleared.length, totalEncounters: nodes.length,
    discoveries: getRecordedDiscoveriesV0516(save), deliveries, materials,
    lead: getNarrativeLeadV0516(save, catalog) }
}

/** No timestamps are available per quest action. This diagnostic deliberately
 * counts accepted missions BETWEEN combat-node completions, not elapsed time. */
export function getQuestCadenceMetricsV0516(save: GameSave, catalog: ContentCatalog) {
  const combatIds = new Set(catalog.trails.trail_astravel_entry.nodes
    .filter(node => node.type === 'battle' || node.type === 'boss').map(node => node.id))
  let acceptedBetween = 0
  let maxAcceptancesBetweenCombats = 0
  let combats = 0
  let accepted = 0
  for (const event of save.eventLog) {
    if (event.startsWith('QuestAccepted:')) { accepted++; acceptedBetween++ }
    if (event.startsWith('TrailNodeCompleted:') && combatIds.has(event.slice('TrailNodeCompleted:'.length))) {
      maxAcceptancesBetweenCombats = Math.max(maxAcceptancesBetweenCombats, acceptedBetween)
      acceptedBetween = 0
      combats++
    }
  }
  return { combats, accepted,
    maxAcceptancesBetweenCombats: Math.max(maxAcceptancesBetweenCombats, acceptedBetween),
    readyDeliveries: Object.values(save.quests).filter(q => q.status === 'ready_to_turn_in').length,
    activeSidequests: Object.values(save.quests).filter(q => q.status === 'active' &&
      catalog.quests[q.questId]?.category === 'secondary').length,
    // Time between battles is not captured by the current save and must not be invented.
    elapsedMinutesBetweenCombats: null as null }
}


/** UX_DRAFT: the first objective can become ready after early battles, but
 * the player can finish the full chapter without a compulsory return to town.
 * Hard-delivery gating would affect existing tutorials and remains OWNER_DECISION. */
export function getChapterContinuationV0516(save: GameSave) {
  const status = save.quests.vs_astravel_first_contact?.status
  if (status === 'ready_to_turn_in' &&
    save.world.trailNodeStates.astravel_camp_03 !== 'completed') {
    return 'O Primeiro Rastro já pode ser entregue, mas você pode concluir os cinco primeiros encontros antes de retornar a Eldamar. A trilha continua disponível.'
  }
  return null
}

/** Use the actual city's location registry; no imaginary NPC marker or route. */
export function getNextStoryNpcDestinationV0516(save: GameSave, catalog: ContentCatalog): TerranLocationId | null {
  const lead = getNarrativeLeadV0516(save, catalog)
  if (!lead?.canOffer) return null
  return TERRAN_LOCATION_IDS.find(id =>
    catalog.terranLocations[id]?.npcPresences.some(npc => npc.npcId === lead.npcId)) ?? null
}

/** After a reward claim, show only objectives which truly correspond to the
 * defeated encounter, recorded visit, or acquired material. Never speculate
 * about change from an unavailable pre-battle snapshot. */
export function getCombatQuestProgressV0516(save: GameSave, catalog: ContentCatalog) {
  const battle = save.battle
  if (!battle || battle.phase !== 'Victory' || !battle.claimed) return []
  const enemyIds = new Set(Object.values(battle.combatants)
    .filter(actor => actor.side === 'enemy' && !actor.alive).map(actor => actor.definitionId))
  const lootIds = new Set(battle.rewards.lootDefinitionIds)
  return Object.values(save.quests).flatMap(progress => {
    const quest = catalog.quests[progress.questId]
    if (!quest || !['active', 'ready_to_turn_in'].includes(progress.status)) return []
    const related = quest.objectives.filter(objective =>
      (objective.type === 'kill' && enemyIds.has(objective.targetId)) ||
      (objective.type === 'visit' && objective.targetId === battle.trailNodeId) ||
      (objective.type === 'collect' && lootIds.has(objective.targetId)))
    const proven = related.filter(objective => (progress.objectives[objective.id] ?? 0) > 0)
    if (!proven.length) return []
    return [{ questId: quest.id, title: quest.title, category: quest.category,
      ready: progress.status === 'ready_to_turn_in',
      objectives: proven.map(objective => ({ label: objective.label,
        current: Math.min(progress.objectives[objective.id] ?? 0, objective.required),
        required: objective.required })) }]
  }).sort((a,b) => (a.category === 'main' ? 0 : 1) - (b.category === 'main' ? 0 : 1))
}
