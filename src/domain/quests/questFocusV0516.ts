import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import type { QuestJournalEntry } from './questSelectors'
import { getQuestJournalEntries } from './questSelectors'
import { isQuestInCurrentChapterV0516 } from './questPacingV0516'

/** v0.5.16 UX_DRAFT. Explicit player tracking comes before any suggested chapter.
 * Pure selectors; they never accept quests or change progress/rewards/save. */
export function getFeaturedSidequestsV0516(
  save: GameSave, entries: QuestJournalEntry[], limit = 3,
): QuestJournalEntry[] {
  return entries.map((entry, index) => ({ entry, index }))
    .sort((a, b) =>
      Number(!a.entry.progress.tracked) - Number(!b.entry.progress.tracked) ||
      Number(!isQuestInCurrentChapterV0516(save, a.entry.definition)) -
        Number(!isQuestInCurrentChapterV0516(save, b.entry.definition)) ||
      a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry)
}

export function getNextPlayerStepV0516(save: GameSave, catalog: ContentCatalog) {
  const entries = getQuestJournalEntries(save, catalog)
    .filter(({ progress }) => ['active', 'ready_to_turn_in'].includes(progress.status))
  const priority = (entry: QuestJournalEntry) => ({
    tracked: Number(!entry.progress.tracked),
    delivery: Number(entry.progress.status !== 'ready_to_turn_in'),
    story: Number(!['main', 'clan', 'class'].includes(entry.definition.category)),
  })
  const sorted = entries.map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const first = priority(a.entry)
      const second = priority(b.entry)
      return first.tracked - second.tracked ||
        first.delivery - second.delivery ||
        first.story - second.story || a.index - b.index
    })
  const selected = sorted[0]?.entry
  if (!selected) return null
  const { definition, progress } = selected
  if (progress.status === 'ready_to_turn_in') {
    const npc = catalog.npcs[definition.turnInNpcId]?.name ?? 'NPC responsável'
    return {
      questId: definition.id, title: definition.title, tracked: progress.tracked,
      phase: 'delivery' as const, message: 'Entregue pessoalmente a ' + npc + '.',
    }
  }
  const pending = definition.objectives.find(objective =>
    (progress.objectives[objective.id] ?? 0) < objective.required)
  if (!pending) return {
    questId: definition.id, title: definition.title, tracked: progress.tracked,
    phase: 'objective' as const,
    message: 'Consulte os requisitos de conclusão no Diário.',
  }
  const current = Math.min(pending.required, Math.max(0, progress.objectives[pending.id] ?? 0))
  return {
    questId: definition.id, title: definition.title, tracked: progress.tracked,
    phase: 'objective' as const,
    message: pending.label + ' · ' + current + '/' + pending.required,
  }
}
