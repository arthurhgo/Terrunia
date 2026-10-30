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

export type NpcQuestMarker = 'available' | 'turnIn' | null

export const getNpcActionableQuests = (save: GameSave, npcId: string, catalog: ContentCatalog) =>
  Object.values(catalog.quests).filter((quest) => quest.giverNpcId === npcId &&
    ['available', 'offered', 'active', 'ready_to_turn_in'].includes(save.quests[quest.id]?.status ?? 'locked'))
    .sort((a, b) => {
      const priority = { ready_to_turn_in: 0, offered: 1, available: 2, active: 3, locked: 4, completed: 5 }
      return priority[save.quests[a.id].status] - priority[save.quests[b.id].status]
        || Number(a.category === 'secondary' || a.category === 'bounty') - Number(b.category === 'secondary' || b.category === 'bounty')
    })

export type NpcWorldMarker = '!' | '◇' | '◆' | '?' | null

export const getNpcWorldMarker = (save: GameSave, npcId: string, catalog: ContentCatalog): NpcWorldMarker => {
  if (npcId === 'npc_rosetta') return '?'
  const quest = getNpcActionableQuests(save, npcId, catalog)[0]
  if (!quest) return null
  if (quest.category === 'secondary' || quest.category === 'bounty') return save.quests[quest.id].status === 'ready_to_turn_in' ? '◆' : '◇'
  return '!'
}

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
