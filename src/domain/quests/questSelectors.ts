import type { ContentCatalog } from '../../content/catalog'
import type { QuestCategory, QuestDefinition } from '../../content/types'
import type { GameSave, QuestProgress, QuestStatus } from '../game/types'

export type QuestJournalEntry = { definition: QuestDefinition; progress: QuestProgress }

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
    return definition ? [{ definition, progress }] : []
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
