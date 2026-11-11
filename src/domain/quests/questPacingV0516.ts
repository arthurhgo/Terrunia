import type { QuestDefinition } from '../../content/types'
import type { GameSave } from '../game/types'

/**
 * v0.5.16 CONTENT_DRAFT — where a NEW offer belongs in the first Astravél arc.
 * Pure read-only pacing. Existing active, offered, ready and completed quests
 * are not re-locked, and no quest/loot ID or save field is changed.
 *
 * Checkpoints are already persisted in save.world.trailNodeStates. Optional
 * mission waves remain accessible after the narrative arc.
 */
export const ASTRAVEL_QUEST_CHAPTERS_V0516 = {
  border: { label: 'Borda Luminescente', from: 1, to: 5, checkpoint: null },
  spores: { label: 'Território dos Esporos', from: 6, to: 10, checkpoint: 'astravel_camp_03' },
  roots: { label: 'Raízes da Ruína', from: 11, to: 15, checkpoint: 'astravel_hunter_refuge_10' },
  aftermath: { label: 'Após Astravél', from: 16, to: 16, checkpoint: 'astravel_boss_preview' },
} as const

export type QuestChapterV0516 = keyof typeof ASTRAVEL_QUEST_CHAPTERS_V0516

/** New offers are distributed to the combats/materials of their stage, not
 * released in a large batch at the first story hand-in. Not a quest limit. */
export const QUEST_CHAPTER_RELEASES_V0516: Readonly<Partial<Record<string, QuestChapterV0516>>> = {
  main_astravel_lost_hunters: 'spores',
  main_astravel_corruption: 'roots',

  // Chapter I — early enemies; existing quest prerequisites still apply.
  side_astravel_thornback_signs: 'border',
  side_street_liora: 'border',
  side_npc_eldamar: 'border',

  // Chapter II — crawler at node 8, slime at node 7, spore armor at node 5.
  side_street_arlen: 'spores',
  side_street_siven: 'spores',
  side_astravel_spore_shells: 'spores',
  side_astravel_forge_chitin: 'spores',
  side_npc_vorren: 'spores',

  // Chapter III — spore/horror enemies in the late route.
  side_street_nara: 'roots',
  side_street_ruven: 'roots',
  side_astravel_mycelial_tracking: 'roots',
  side_npc_lithwynn: 'roots',

  // Chapter aftermath, optional contract board / return to the NPC.
  side_astravel_ruin_wardens: 'aftermath',
  side_street_garrik: 'aftermath',
  delivery_arlen_nuclei: 'aftermath',
  delivery_liora_spores: 'aftermath',
  delivery_garrik_chitin: 'aftermath',
  delivery_siven_shards: 'aftermath',
  delivery_nara_echoes: 'aftermath',
  delivery_ruven_fibers: 'aftermath',
  delivery_eldamar_echoes: 'aftermath',
  delivery_daeryn_gels: 'aftermath',
  delivery_vorren_samples: 'aftermath',
  delivery_lithwynn_shards: 'aftermath',
  delivery_neris_stock: 'aftermath',
  delivery_durnan_batch: 'aftermath',
}

/** Clan and Class identity is governed by their own NPC/quest/rite requirements,
 * not by the optional Astravél contract-release calendar. */
export function questChapterV0516(definition: QuestDefinition): QuestChapterV0516 | null {
  const mapped = QUEST_CHAPTER_RELEASES_V0516[definition.id]
  if (mapped) return mapped
  if (definition.category !== 'secondary') return null
  if (definition.id.startsWith('side_clan_') ||
    definition.id.startsWith('side_npc_master_') ||
    ['side_npc_mireya_dunavar', 'side_npc_observador_cebios',
      'side_npc_guardador_estres', 'side_npc_curador_nexo', 'side_npc_master_rustal'].includes(definition.id) ||
    definition.id.startsWith('rosetta_tutorial_')) return null
  // Unscheduled general requests are post-arc optional content, not opening spam.
  return 'aftermath'
}

function reachedCheckpoint(save: GameSave, chapter: QuestChapterV0516): boolean {
  if (chapter === 'border') return true
  const nodeId = ASTRAVEL_QUEST_CHAPTERS_V0516[chapter].checkpoint
  return nodeId !== null && save.world.trailNodeStates[nodeId] === 'completed'
}

export function currentQuestChapterV0516(save: GameSave): QuestChapterV0516 {
  return reachedCheckpoint(save, 'aftermath') ? 'aftermath'
    : reachedCheckpoint(save, 'roots') ? 'roots'
      : reachedCheckpoint(save, 'spores') ? 'spores' : 'border'
}

/** Applies only to a NEW available offer. Offered/accepted legacy tasks are
 * grandfathered as-is; checkpoint status never grants automatic acceptance. */
export function isQuestOfferUnlockedV0516(save: GameSave, definition: QuestDefinition): boolean {
  const rule = questChapterV0516(definition)
  if (!rule || save.quests[definition.id]?.status !== 'available') return true
  return reachedCheckpoint(save, rule)
}

/** Visual grouping is derived, never persisted; older 29-quest saves stay intact. */
export function isQuestInCurrentChapterV0516(save: GameSave, definition: QuestDefinition): boolean {
  const chapter = questChapterV0516(definition)
  return chapter === null || chapter === currentQuestChapterV0516(save)
}
