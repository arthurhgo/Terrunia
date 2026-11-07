/** v0.5.10 CONTENT_DRAFT: expand by ID, never by image path or implicit locale.
 * Exactly one biome currently has a playable trail. Future entries cannot be entered
 * until the owner approves the progression and a functional scene exists.
 */
export type BiomeManifest = {
  id: string
  name: string
  levelMinDraft: number
  levelMaxDraft: number
  trailIds: readonly string[]
  playable: boolean
  stage: number
  status: 'EXISTING' | 'CONTENT_DRAFT'
}
export const biomeRegistry = [
  {
    id: 'biome_astravel', name: 'Floresta de Astravél',
    levelMinDraft: 1, levelMaxDraft: 6, trailIds: ['trail_astravel_entry'],
    playable: true, stage: 1, status: 'EXISTING',
  },
  {
    id: 'biome_cerrado_mistico', name: 'Cerrado Místico',
    levelMinDraft: 6, levelMaxDraft: 10, trailIds: [],
    playable: false, stage: 2, status: 'CONTENT_DRAFT',
  },
  {
    id: 'biome_deserto_elduran', name: 'Deserto de Elduran',
    levelMinDraft: 10, levelMaxDraft: 14, trailIds: [],
    playable: false, stage: 3, status: 'CONTENT_DRAFT',
  },
  {
    id: 'biome_deserto_glacial', name: 'Deserto Glacial',
    levelMinDraft: 14, levelMaxDraft: 18, trailIds: [],
    playable: false, stage: 4, status: 'CONTENT_DRAFT',
  },
  {
    id: 'biome_montanhas_korduun', name: 'Montanhas de Korduun',
    levelMinDraft: 18, levelMaxDraft: 23, trailIds: [],
    playable: false, stage: 5, status: 'CONTENT_DRAFT',
  },
] as const satisfies readonly BiomeManifest[]

export const getPlayableBiome = (id: string): BiomeManifest | null =>
  biomeRegistry.find((biome) => biome.id === id && biome.playable && biome.trailIds.length > 0) ?? null
