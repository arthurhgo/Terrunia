import type { GameSave, QuestStatus } from '../game/types'
import type { ContentCatalog } from '../../content/catalog'
import { ASTRAVEL_SECTORS } from '../../content/astravel'

export type AstravelChapterProgress = {
  id: string
  title: string
  range: string
  questId: string
  questTitle: string
  questStatus: QuestStatus
  cleared: number
  total: number
  label: string
}

/** Derived mission-to-combat alignment. Never accepts/finishes quests or rewrites saved progress. */
export function getAstravelChapterProgress(save: GameSave, catalog: ContentCatalog): AstravelChapterProgress[] {
  const trail = catalog.trails.trail_astravel_entry
  return ASTRAVEL_SECTORS.map((sector) => {
    const nodes = trail.nodes.filter((node) => node.sectorId === sector.id)
    const cleared = nodes.filter((node) => save.world.trailNodeStates[node.id] === 'completed').length
    const quest = catalog.quests[sector.questId]
    const questStatus = save.quests[sector.questId]?.status ?? 'locked'
    const label = questStatus === 'completed' ? 'Relato entregue'
      : questStatus === 'ready_to_turn_in' ? 'Retorne ao NPC responsável'
        : questStatus === 'active' ? 'Missão aceita · explore o trecho'
          : questStatus === 'available' || questStatus === 'offered' ? 'Missão disponível · aceite com o NPC'
            : 'Aguardando etapa anterior'
    return {
      id: sector.id, title: sector.name, range: `${sector.from}–${sector.to}`,
      questId: sector.questId, questTitle: quest.title,
      questStatus, cleared, total: nodes.length, label,
    }
  })
}
