import type { ContentCatalog } from '../../content/catalog'
import type { QuestCategory, QuestDefinition } from '../../content/types'
import type { GameSave, QuestProgress, QuestStatus } from '../game/types'

export type QuestJournalEntry = { definition: QuestDefinition; progress: QuestProgress }

export const resolveQuestDefinition = (save: GameSave, definition: QuestDefinition): QuestDefinition => {
  const classId = save.character.classProgression.classId
  const variant = classId ? definition.classVariants?.[classId] : undefined
  return variant ? { ...definition, title: variant.title ?? definition.title, summary: variant.summary } : definition
}

export const QUEST_JOURNAL_CATEGORIES: Array<{ id: QuestCategory | 'completed'; label: string }> = [
  { id: 'main', label: 'Principal' },
  { id: 'clan', label: 'Clã' },
  { id: 'class', label: 'Classe' },
  { id: 'secondary', label: 'Secundárias' },
  { id: 'bounty', label: 'Caça / Contratos' },
  { id: 'completed', label: 'Concluídas' },
]

export const getQuestJournalEntries = (save: GameSave, catalog: ContentCatalog): QuestJournalEntry[] =>
  Object.values(save.quests).flatMap((progress) => {
    if (!['active', 'ready_to_turn_in', 'completed'].includes(progress.status)) return []
    const definition = catalog.quests[progress.questId]
    return definition ? [{ definition: resolveQuestDefinition(save, definition), progress }] : []
  })

export const getQuestEntriesByCategory = (
  entries: QuestJournalEntry[],
  category: QuestCategory | 'completed',
) => entries.filter(({ definition, progress }) => category === 'completed'
  ? progress.status === 'completed'
  : progress.status !== 'completed' && definition.category === category)

export const getTrackedQuestEntries = (save: GameSave, catalog: ContentCatalog) =>
  getQuestJournalEntries(save, catalog).filter(({ progress }) =>
    progress.tracked && ['active', 'ready_to_turn_in'].includes(progress.status))

/** One shared priority for the journal, Rosetta and city guidance.
 * Ready delivery > accepted progress > new offer; story before optional content.
 * No state is mutated and completed/locked quests never compete for attention.
 */
export const getPrioritizedQuestEntries = (save: GameSave, catalog: ContentCatalog): QuestJournalEntry[] => {
  const statusWeight: Partial<Record<QuestStatus, number>> = {
    ready_to_turn_in: 0, active: 1, offered: 2, available: 3,
  }
  const categoryWeight: Record<QuestCategory, number> = {
    main: 0, clan: 1, class: 2, secondary: 3, bounty: 4,
  }
  return Object.values(catalog.quests).flatMap((definition) => {
    const progress = save.quests[definition.id]
    return progress && statusWeight[progress.status] !== undefined
      ? [{ definition: resolveQuestDefinition(save, definition), progress }]
      : []
  }).sort((a, b) =>
    (statusWeight[a.progress.status] ?? 9) - (statusWeight[b.progress.status] ?? 9)
    || categoryWeight[a.definition.category] - categoryWeight[b.definition.category]
    || Number(!a.progress.tracked) - Number(!b.progress.tracked))
}

export const getSuggestedQuest = (save: GameSave, catalog: ContentCatalog): QuestJournalEntry | null =>
  getPrioritizedQuestEntries(save, catalog)[0] ?? null

export const getQuestJournalGroups = (entries: QuestJournalEntry[]) => [
  { id: 'main', label: 'Missão principal' },
  { id: 'secondary', label: 'Secundárias' },
  { id: 'clan', label: 'Clã' },
  { id: 'class', label: 'Classe' },
  { id: 'bounty', label: 'Caça e contratos' },
  { id: 'completed', label: 'Concluídas' },
].map((group) => ({ ...group, entries: entries.filter(({ definition, progress }) => group.id === 'completed'
  ? progress.status === 'completed' : progress.status !== 'completed' && definition.category === group.id)
  .sort((a, b) => Number(b.progress.status === 'ready_to_turn_in') - Number(a.progress.status === 'ready_to_turn_in')) }))
  .filter((group) => group.entries.length > 0)

export type NpcQuestMarker = 'available' | 'turnIn' | null

export const getNpcActionableQuests = (save: GameSave, npcId: string, catalog: ContentCatalog) =>
  Object.values(catalog.quests).filter((quest) => {
    const status = save.quests[quest.id]?.status ?? 'locked'
    return (quest.giverNpcId === npcId && ['available', 'offered', 'active', 'ready_to_turn_in'].includes(status))
      || (quest.turnInNpcId === npcId && status === 'ready_to_turn_in')
  })
    .sort((a, b) => {
      const priority = { ready_to_turn_in: 0, offered: 1, available: 1, active: 2, locked: 4, completed: 5 }
      return priority[save.quests[a.id].status] - priority[save.quests[b.id].status]
        || Number(a.category === 'secondary' || a.category === 'bounty') - Number(b.category === 'secondary' || b.category === 'bounty')
    })

export type NpcWorldMarker = '!' | '◇' | '◆' | '?' | null
/** Derived display counts. Completed/locked quests never appear as open offers. */
export const getNpcQuestCounts = (save: GameSave, npcId: string, catalog: ContentCatalog) => {
  const totals = { available: 0, active: 0, ready: 0 }
  for (const definition of Object.values(catalog.quests)) {
    const status = save.quests[definition.id]?.status
    if (definition.giverNpcId === npcId && (status === 'available' || status === 'offered')) totals.available += 1
    if (definition.giverNpcId === npcId && status === 'active') totals.active += 1
    if (definition.turnInNpcId === npcId && status === 'ready_to_turn_in') totals.ready += 1
  }
  return totals
}

export type NpcMarkerPhase = 'guide' | 'available' | 'active' | 'turn-in'

export const getNpcQuestNotice = (save: GameSave, npcId: string, catalog: ContentCatalog): { marker: NpcWorldMarker; phase: NpcMarkerPhase } => {
  if (npcId === 'npc_rosetta') return { marker: '?', phase: 'guide' }
  const quest = getNpcActionableQuests(save, npcId, catalog)[0]
  if (!quest) return { marker: null, phase: 'available' }
  const status = save.quests[quest.id].status
  const phase = status === 'active' ? 'active' : status === 'ready_to_turn_in' ? 'turn-in' : 'available'
  return { marker: quest.category === 'secondary' || quest.category === 'bounty' ? phase === 'turn-in' ? '◆' : '◇' : '!', phase }
}

export const getNpcWorldMarker = (save: GameSave, npcId: string, catalog: ContentCatalog): NpcWorldMarker => getNpcQuestNotice(save, npcId, catalog).marker

export const getNpcQuestMarker = (save: GameSave, npcId: string, catalog: ContentCatalog): NpcQuestMarker => {
  for (const definition of Object.values(catalog.quests)) {
    if (definition.turnInNpcId === npcId && save.quests[definition.id]?.status === 'ready_to_turn_in') return 'turnIn'
  }
  for (const definition of Object.values(catalog.quests)) {
    const status = save.quests[definition.id]?.status
    if (definition.giverNpcId === npcId && status && ['available', 'offered'].includes(status)) return 'available'
  }
  return null
}

export const getQuestStatusLabel = (status: QuestStatus) => ({
  locked: 'Bloqueada',
  available: 'Disponível',
  offered: 'Oferta aberta',
  active: 'Em andamento',
  ready_to_turn_in: 'Pronta para entregar',
  completed: 'Concluída',
}[status])
