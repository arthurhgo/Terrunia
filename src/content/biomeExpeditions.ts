import { rebalanceEnemyV05152 } from './enemyBalanceV05152'
import type { EncounterDefinition, EnemyDefinition, ItemDefinition, TrailDefinition, TrailNodeDefinition } from './types'

/**
 * v0.5.10 CONTENT_DRAFT / BALANCE_DRAFT.
 * Two playable vertical slices using fauna from the existing biomes lore.
 * Order, stage counts, statistics, and material economy: OWNER_DECISION.
 * Rare-drop and rune draft catalogs remain DISABLED and are not referenced here.
 */
const materials = [
  { id: 'drop_cerrado_shed_scale', name: 'Escama da Sombra', biome: 'cerrado', essence: 36, gold: 13 },
  { id: 'drop_cerrado_luminous_shell', name: 'Casca de Fulgor', biome: 'cerrado', essence: 46, gold: 17 },
  { id: 'drop_cerrado_wolf_fang', name: 'Presa de Carcaça', biome: 'cerrado', essence: 58, gold: 23 },
  { id: 'drop_cerrado_static_dust', name: 'Pó Estático', biome: 'cerrado', essence: 77, gold: 30 },
  { id: 'drop_elduran_jackal_fur', name: 'Pelo de Chacal das Sombras', biome: 'elduran', essence: 58, gold: 20 },
  { id: 'drop_elduran_steel_chitin', name: 'Quitina de Aço', biome: 'elduran', essence: 72, gold: 27 },
  { id: 'drop_elduran_solar_ash', name: 'Cinza Solar', biome: 'elduran', essence: 85, gold: 32 },
  { id: 'drop_elduran_animated_sand', name: 'Areia Animada', biome: 'elduran', essence: 105, gold: 42 },
] as const

export const biomeMaterialDefinitions: ItemDefinition[] = materials.map((material) => ({
  id: material.id, name: material.name,
  description: 'Material comum recuperado durante expedição em ' + (material.biome === 'cerrado' ? 'Cerrado Místico.' : 'Elduran.') +
    ' Pode ser convertido ou vendido; não substitui equipamentos vinculados.',
  category: 'material', rarity: 'common',
  convertToEssence: true, essenceValue: material.essence,
  sellable: true, sellValue: material.gold,
  questLocked: false, canInfuseBoundItem: false, combatEffects: [],
  affinityTags: [material.biome, 'field-material'],
  iconAssetId: 'item.' + material.id.replaceAll('_', '-'), status: 'BALANCE_DRAFT',
}))

const species = [
  { id: 'lagarto_sombra', name: 'Lagarto-Sombra', level: 6, hp: 20, armor: 2, attack: 5, loot: 'drop_cerrado_shed_scale', asset: 'lagarto-sombra' },
  { id: 'tatu_fulgor', name: 'Tatu-Fulgor', level: 7, hp: 25, armor: 3, attack: 5, loot: 'drop_cerrado_luminous_shell', asset: 'tatu-fulgor' },
  { id: 'corvo_bruxo', name: 'Corvo-Bruxo', level: 7, hp: 19, armor: 1, attack: 6, loot: 'drop_cerrado_luminous_shell', asset: 'corvo-bruxo' },
  { id: 'lobo_carcaca', name: 'Lobo-Carcaça', level: 8, hp: 30, armor: 2, attack: 7, loot: 'drop_cerrado_wolf_fang', asset: 'lobo-carcaca' },
  { id: 'serpente_tempestade', name: 'Serpente-Tempestade', level: 10, hp: 49, armor: 3, attack: 8, loot: 'drop_cerrado_static_dust', asset: 'serpente-tempestade', boss: true },
  { id: 'chacal_sombras', name: 'Chacal das Sombras', level: 10, hp: 30, armor: 2, attack: 8, loot: 'drop_elduran_jackal_fur', asset: 'chacal-sombras' },
  { id: 'escorpiao_aco', name: 'Escorpião-Aço', level: 11, hp: 37, armor: 4, attack: 8, loot: 'drop_elduran_steel_chitin', asset: 'escorpiao-aco' },
  { id: 'serpente_solar', name: 'Serpente Solar', level: 12, hp: 35, armor: 2, attack: 9, loot: 'drop_elduran_solar_ash', asset: 'serpente-solar' },
  { id: 'golem_areia', name: 'Golem de Areia', level: 14, hp: 62, armor: 5, attack: 10, loot: 'drop_elduran_animated_sand', asset: 'golem-areia', boss: true },
] as const

export const biomeEnemyDefinitions: EnemyDefinition[] = species.map((entry): EnemyDefinition => ({
  id: 'enemy_' + entry.id, name: entry.name, level: entry.level,
  maxHp: entry.hp, mitigation: entry.armor, attackPower: entry.attack,
  xpReward: entry.level * 9, goldReward: entry.level * 4,
  boundResonanceReward: entry.level * 6,
  lootDefinitionIds: [entry.loot], skillIds: [],
  boss: 'boss' in entry && entry.boss === true,
  weaknessTags: entry.level >= 10 ? ['resonance'] : ['arcane'],
  assetId: 'enemy.' + entry.asset, status: 'BALANCE_DRAFT',
})).map(rebalanceEnemyV05152)

type SliceStage = {
  id: string; label: string; x: number; y: number; species: string[]
  description: string; hint: string; checkpoint?: boolean
}
type SliceSpec = {
  id: 'trail_cerrado_mistico' | 'trail_deserto_elduran'
  entry: string; region: 'cerrado' | 'elduran'
  title: string; act: string; stages: SliceStage[]
}
const slices: SliceSpec[] = [
  {
    id: 'trail_cerrado_mistico', entry: 'cerrado_entry', region: 'cerrado',
    title: 'Cerrado Místico', act: 'Ecos da Savana Arcana · 4 encontros',
    stages: [
      { id: 'cerrado_shadow_01', label: 'Sombras do Capim', x: 28, y: 21, species: ['lagarto_sombra', 'lagarto_sombra'],
        description: 'Lagartos camuflados vigiam as gramíneas afiadas do cerrado.', hint: 'Concentre dano em um alvo antes de enfrentar o próximo.' },
      { id: 'cerrado_glow_02', label: 'Casca e Presságio', x: 57, y: 26, species: ['tatu_fulgor', 'corvo_bruxo'], checkpoint: true,
        description: 'Um Tatu-Fulgor afugenta aves enquanto os Corvos-Bruxos observam.', hint: 'Marco de apoio: recupera parcialmente Vida e Mana após a vitória.' },
      { id: 'cerrado_pack_03', label: 'Uivo na Vereda', x: 78, y: 58, species: ['lobo_carcaca', 'lobo_carcaca'],
        description: 'Dois Lobos-Carcaça rondam a passagem entre os cactos cristalinos.', hint: 'Defender e curar pode ser decisivo diante de ataques sucessivos.' },
      { id: 'cerrado_storm_04', label: 'Olho da Tempestade', x: 43, y: 81, species: ['serpente_tempestade'],
        description: 'Uma Serpente-Tempestade domina o campo carregado de eletricidade.', hint: 'Chefe provisório da instância; não concede runas ou peças vinculadas.' },
    ],
  },
  {
    id: 'trail_deserto_elduran', entry: 'elduran_entry', region: 'elduran',
    title: 'Deserto de Elduran', act: 'Miragens sob a Areia · 4 encontros',
    stages: [
      { id: 'elduran_jackals_01', label: 'Passagem dos Chacais', x: 28, y: 21, species: ['chacal_sombras', 'chacal_sombras'],
        description: 'Chacais das Sombras caçam nos limites das dunas.', hint: 'Evite ser cercado; concentre dano em um inimigo de cada vez.' },
      { id: 'elduran_stinger_02', label: 'Ferrões do Deserto', x: 59, y: 26, species: ['escorpiao_aco', 'chacal_sombras'], checkpoint: true,
        description: 'Um Escorpião-Aço protege as ruínas semienterradas.', hint: 'A couraça do escorpião pede técnicas que rompem mitigação.' },
      { id: 'elduran_sun_03', label: 'Crepúsculo Solar', x: 79, y: 61, species: ['serpente_solar', 'serpente_solar'],
        description: 'Serpentes Solares absorvem o calor remanescente do deserto.', hint: 'Reserve Mana para um confronto longo.' },
      { id: 'elduran_golem_04', label: 'Coração das Dunas', x: 43, y: 82, species: ['golem_areia'],
        description: 'Um Golem de Areia desperta sob os alicerces de um templo soterrado.', hint: 'Chefe provisório da instância; sua recompensa é material comum.' },
    ],
  },
]

const speciesById = Object.fromEntries(biomeEnemyDefinitions.map((enemy) => [enemy.id, enemy]))
export const biomeTrailDefinitions: TrailDefinition[] = slices.map((slice) => {
  const nodes: TrailNodeDefinition[] = [{
    id: slice.entry, index: 0, type: 'entry', label: 'Entrada',
    description: 'Portal de Terran · ' + slice.title, position: { x: 12, y: 13 },
  }, ...slice.stages.map((stage, index): TrailNodeDefinition => ({
    id: stage.id, index: index + 1, type: index === slice.stages.length - 1 ? 'boss' : 'battle',
    label: stage.label, encounterId: 'encounter_' + stage.id,
    actionLabel: 'Enfrentar ' + stage.label,
    description: stage.description, tacticalHint: stage.hint,
    position: { x: stage.x, y: stage.y }, recommendedLevel: slice.region === 'cerrado' ? 6 + index : 10 + index,
    checkpoint: Boolean(stage.checkpoint), sectorId: slice.region,
  })) ]
  return { id: slice.id, name: slice.title, regionId: slice.region, actLabel: slice.act,
    nodes, status: 'CONTENT_DRAFT' }
})

export const biomeEncounterDefinitions: EncounterDefinition[] = slices.flatMap((slice) =>
  slice.stages.map((stage, index) => {
    const enemies = stage.species.map((id) => speciesById['enemy_' + id])
    const boss = index === slice.stages.length - 1
    return {
      id: 'encounter_' + stage.id, trailNodeId: stage.id,
      name: boss ? enemies[0].name : stage.label, locationLabel: slice.title,
      victoryTitle: boss ? 'A passagem foi dominada' : 'Marco conquistado',
      victorySummary: stage.description + ' O caminho foi registrado em sua campanha.',
      enemyDefinitionIds: enemies.map((enemy) => enemy.id), canFlee: false,
      rewards: {
        characterXp: enemies.reduce((sum, enemy) => sum + enemy.xpReward, 0),
        gold: enemies.reduce((sum, enemy) => sum + enemy.goldReward, 0),
        boundResonance: enemies.reduce((sum, enemy) => sum + enemy.boundResonanceReward, 0),
        lootDefinitionIds: enemies.flatMap((enemy) => enemy.lootDefinitionIds),
        ...(stage.checkpoint ? { fieldRecovery: { hp: 12, mp: 8 } } : {}),
        ...(boss ? { worldFlags: ['biome_route_completed:' + slice.region] } : {}),
      },
      status: 'BALANCE_DRAFT',
    }
  }))
