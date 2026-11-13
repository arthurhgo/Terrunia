import { castleGearMerchantsV05151 } from '../content/castleMerchantsV05151'
import { equipmentOffersV0515, gearSpriteId, type GearGrade } from '../content/equipmentV0515'
import {modularPartsV05171} from '../content/modularWeaponsV05171'
import { combatSkillDefinitions } from '../content/combat'
import { extraCombatStatusesV0517 } from '../content/combatAdvancementsV0517'
import type { CombatSkillDefinition } from '../content/types'
import { biomeMaterialDefinitions, biomeEnemyDefinitions } from '../content/biomeExpeditions'
import { complementaryItemDefinitions } from '../content/complementaryItems'
import type { BoundSlot } from '../domain/shared/types'
import { visualEquipmentCatalog } from '../content/visualEquipment'
import { gemComponentDefinitions } from '../content/gems'
import { npcVisualDefinitions } from '../content/npcVisuals'

export type AssetEntry = {
  id: string
  path: string
  fallback: string
  alt: string
  pixelArt?: boolean
  /** Visual draft awaiting creator-supplied PNG; valid fallback is mandatory. */
  draftPlaceholder?: true
  /** Optional 4×4 native pixel-animation sheet, 32px per frame (UI only). */
  motionSheet?: {
    path: string
    rhythm: 'thorn' | 'bulwark' | 'stalker' | 'warden'
    idleMs: number
    attackMs: number
    hitMs: number
    defeatMs: number
  }
}

const FALLBACK = '/assets/placeholders/generic.svg'

const entries: AssetEntry[] = [
 {id:'skill.shield-bash-v05171',path:'/assets/skills/skill_shield_bash_v05171.svg',fallback:'/assets/placeholders/skill.svg',alt:'Golpe de Escudo',pixelArt:true,draftPlaceholder:true},
 ...modularPartsV05171.map(part=>({id:part.assetId,path:'/assets/modular/'+part.family+'/'+part.partSlot+'_t'+part.tier+'.svg',fallback:'/assets/placeholders/item.svg',alt:part.name,pixelArt:true,draftPlaceholder:true as const})),
  ...equipmentOffersV0515.flatMap((gear) => ([1,2,3] as GearGrade[]).map((grade) => ({
    id: gearSpriteId(gear,grade),
    path: '/assets/equipment/v05151/' + gear.id + '_g' + grade + '.png',
    fallback: '/assets/placeholders/item.svg',
    alt: gear.name + ' · Grau ' + grade,
    pixelArt: true,
  }))),
  ...castleGearMerchantsV05151.map((merchant) => ({
    id: merchant.portraitAssetId,
    path: '/assets/npcs/castle_merchants/' + merchant.npcId + '.png',
    fallback: '/assets/placeholders/npc.svg',
    alt: merchant.name,
    pixelArt: true,
  })),

  {id:'action.attack-single',path:'/assets/actions/attack_single.png',fallback:'/assets/placeholders/skill.svg',alt:'Ataque Único',pixelArt:true},
  {id:'action.attack-area',path:'/assets/actions/attack_cleave.png',fallback:'/assets/placeholders/skill.svg',alt:'Ataque em Área',pixelArt:true},
  ...['blade','axe','bow','dagger','arcaneFocus','grimoire','staff'].flatMap(family=>
    ['single','area'].map(kind=>({id:'action.weapon.'+family+'.'+kind,
      path:'/assets/actions/v0517/'+family+'_'+kind+'.svg',fallback:'/assets/placeholders/skill.svg',
      alt:family+' · '+kind,pixelArt:true,draftPlaceholder:true as const}))),
  {id:'equipment.offhand.quiver_v0517',path:'/assets/equipment/offhand/quiver_v0517.svg',
    fallback:'/assets/placeholders/item.svg',alt:'Aljava Vinculada',pixelArt:true,draftPlaceholder:true},
  ...extraCombatStatusesV0517.map(effect=>({id:'status.'+effect.id,
    path:'/assets/status/'+effect.id+'.svg',fallback:'/assets/placeholders/skill.svg',
    alt:effect.name,pixelArt:true,draftPlaceholder:true as const})),
  ...['status_resonant_fracture','status_clan_aegis','status_clan_rune_ward','status_clan_disjunction','status_clan_omen','status_clan_containment']
    .map(id=>({id:`status.${id}`,path:`/assets/status/${id}.png`,fallback:'/assets/placeholders/skill.svg',alt:id,pixelArt:true})),

  { id: 'skill.use-healing-potion', path: '/assets/skills/skill_use_healing_potion.png',
    fallback: '/assets/placeholders/skill.svg', alt: 'Poção Restauradora', pixelArt: true },
  { id: 'item.clan-granite-emblem', path: '/assets/items/quest_clan_granite_emblem.svg',
    fallback: '/assets/placeholders/item.svg', alt: 'Emblema de Clã', pixelArt: true, draftPlaceholder: true },
  { id: 'enemy.granite-golem', path: '/assets/enemies/bosses/enemy_granite_golem_idle.svg',
    fallback: '/assets/placeholders/enemy.svg', alt: 'Golem de Granito · Korduun', pixelArt: true, draftPlaceholder: true },
  { id: 'enemy.ruin-corrupted-sentinel', path: '/assets/enemies/bosses/enemy_ruin_corrupted_sentinel_idle.png',
    fallback: '/assets/placeholders/enemy.svg', alt: 'Sentinela Corrompida · Núcleo da Ruína', pixelArt: true },
  ...(combatSkillDefinitions as CombatSkillDefinition[]).map((skill) => ({
    id: skill.iconAssetId ?? `skill.${skill.id}`,
    path: `/assets/skills/${skill.id}.${skill.id.endsWith('_v0517') ? 'svg' : 'png'}`,
    fallback: '/assets/placeholders/skill.svg',
    alt: skill.name, pixelArt: true,
    ...((skill.id === 'skill_granite_slam' || skill.id.endsWith('_v0517')) ? { draftPlaceholder: true as const } : {}),
  })),
  ...complementaryItemDefinitions.map((item) => ({
    id: item.iconAssetId, path: '/assets/items/complementary/' + item.id + '.svg',
    fallback: '/assets/placeholders/item.svg', alt: item.name, pixelArt: true, draftPlaceholder: true as const,
  })),
  ...biomeMaterialDefinitions.map((item) => ({
    id: item.iconAssetId, path: '/assets/items/biomes/' + item.id + '.svg',
    fallback: '/assets/placeholders/item.svg', alt: item.name, pixelArt: true, draftPlaceholder: true,
  })),
  ...biomeEnemyDefinitions.map((enemy) => ({
    id: enemy.assetId, path: '/assets/enemies/biomes/' + enemy.assetId.slice(6) + '.png',
    fallback: '/assets/placeholders/enemy.svg', alt: enemy.name, pixelArt: true, draftPlaceholder: true,
  })),
  {
    id: 'item.daeryn-home-key', path: '/assets/items/item_daeryn_home_key.png',
    fallback: '/assets/placeholders/item.svg', alt: 'Chave de Daeryn', pixelArt: true,
  },
  ...[
    { name: 'worn-linen-tunic', label: 'Túnica de Linho Gasta' }, { name: 'apprentice-tunic', label: 'Túnica de Aprendiz' },
    { name: 'simple-leather-armor', label: 'Armadura de Couro Simples' }, { name: 'linen-thread', label: 'Linha de Linho' },
  ].map(({ name, label }) => ({
    id: `item.${name}`, path: `/assets/items/item_${name.replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg', alt: label, pixelArt: true,
  })),
  { id: 'enemy.blackroot-titan', path: '/assets/enemies/fungorros/enemy_blackroot_titan_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'Titan Raiz-Negra', pixelArt: true },
  ...['fungal-gel', 'mycelial-fiber', 'blackroot-core', 'hunter-insignia'].map((name) => ({
    id: `item.${name}`, path: `/assets/items/item_${name.replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg', alt: name, pixelArt: true,
  })),
  {
    id: 'character.terririan.default',
    path: '/assets/characters/terririan/player_default.png',
    fallback: '/assets/placeholders/character.svg',
    alt: 'Retrato do Terrírian',
    pixelArt: true,
  },
  {
    id: 'character.terririan.sigil',
    path: '/assets/characters/terririan/player_sigil.png',
    fallback: '/assets/placeholders/character-alt.svg',
    alt: 'Retrato alternativo do Terrírian',
    pixelArt: true,
  },
  {
    id: 'character.terririan.map',
    // Defaults to the existing portrait; while not a 128×128 sheet, canvas uses the pixel-matrix actor.
    path: '/assets/characters/terririan/player_default.png',
    fallback: '/assets/placeholders/character.svg',
    alt: 'Spritesheet opcional de quatro direções do Terrírian (4 colunas × 4 linhas, quadros 32×32)',
    pixelArt: true,
  },
  ...npcVisualDefinitions.map((profile) => ({
    id: profile.assetId, path: profile.path, fallback: '/assets/placeholders/npc.svg',
    alt: `Retrato pixel art de ${profile.name}`, pixelArt: true,
  })),
  ...['runic-alloy', 'weapon-core', 'mycelial-resin', 'echo-fragment'].map((id) => ({
    id: `item.${id}`, path: `/assets/items/item_${id.replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg', alt: id, pixelArt: true,
  })),
  {
    id: 'enemy.fungorro-crawler',
    path: '/assets/enemies/fungorros/enemy_fungorro_crawler_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Fungorro Rastejante',
    pixelArt: true,
  },
  {
    id: 'enemy.spore-sower',
    path: '/assets/enemies/fungorros/enemy_spore_sower_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Semeador de Esporos',
    pixelArt: true,
  },
  {
    id: 'enemy.fungal-slime',
    path: '/assets/enemies/fungorros/enemy_fungal_slime_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Bola de Gosma Fúngica',
    pixelArt: true,
  },
  {
    id: 'enemy.fungal-horror',
    path: '/assets/enemies/fungorros/enemy_fungal_horror_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Horror Esporulante',
    pixelArt: true,
  },
  {
    id: 'enemy.colossus-mycelium',
    path: '/assets/enemies/bosses/enemy_colossus_mycelium_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Colosso Micélio',
    pixelArt: true,
  },
  { id: 'enemy.luminous-slime', path: '/assets/enemies/portal/enemy_luminous_slime_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.luminous-slime', pixelArt: true },
  { id: 'enemy.void-moth', path: '/assets/enemies/portal/enemy_void_moth_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.void-moth', pixelArt: true },
  { id: 'enemy.spore-mantis', path: '/assets/enemies/portal/enemy_spore_mantis_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.spore-mantis', pixelArt: true },
  { id: 'enemy.ruin-sentinel', path: '/assets/enemies/portal/enemy_ruin_sentinel_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.ruin-sentinel', pixelArt: true },
  // VISUAL_DRAFT: native PNG frame sheets are presentation-only, replaceable by asset ID.
  { id: 'enemy.fungorro-thornback', path: '/assets/enemies/progression/enemy_fungorro_thornback_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'Fungorro Espinhal', pixelArt: true, motionSheet: { path: '/assets/enemies/progression/enemy_fungorro_thornback_motion.png', rhythm: 'thorn', idleMs: 1050, attackMs: 620, hitMs: 420, defeatMs: 850 } },
  { id: 'enemy.spore-bulwark', path: '/assets/enemies/progression/enemy_spore_bulwark_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'Casco de Esporos', pixelArt: true, motionSheet: { path: '/assets/enemies/progression/enemy_spore_bulwark_motion.png', rhythm: 'bulwark', idleMs: 1480, attackMs: 750, hitMs: 520, defeatMs: 1150 } },
  { id: 'enemy.mycelial-stalker', path: '/assets/enemies/progression/enemy_mycelial_stalker_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'Rastreador Micelial', pixelArt: true, motionSheet: { path: '/assets/enemies/progression/enemy_mycelial_stalker_motion.png', rhythm: 'stalker', idleMs: 730, attackMs: 480, hitMs: 350, defeatMs: 690 } },
  { id: 'enemy.ruin-warden', path: '/assets/enemies/progression/enemy_ruin_warden_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'Vigia do Limiar', pixelArt: true, motionSheet: { path: '/assets/enemies/progression/enemy_ruin_warden_motion.png', rhythm: 'warden', idleMs: 1750, attackMs: 880, hitMs: 600, defeatMs: 1200 } },
  { id: 'item.resonance-flask', path: '/assets/items/item_resonance_flask.png', fallback: '/assets/placeholders/item.svg', alt: 'item.resonance-flask', pixelArt: true },
  { id: 'item.field-rune', path: '/assets/items/item_field_rune.png', fallback: '/assets/placeholders/item.svg', alt: 'item.field-rune', pixelArt: true },
  { id: 'item.vital-essence', path: '/assets/items/item_vital_essence.png', fallback: '/assets/placeholders/item.svg', alt: 'item.vital-essence', pixelArt: true },
  { id: 'item.luminous-gel', path: '/assets/items/item_luminous_gel.png', fallback: '/assets/placeholders/item.svg', alt: 'item.luminous-gel', pixelArt: true },
  { id: 'item.void-dust', path: '/assets/items/item_void_dust.png', fallback: '/assets/placeholders/item.svg', alt: 'item.void-dust', pixelArt: true },
  { id: 'item.spore-chitin', path: '/assets/items/item_spore_chitin.png', fallback: '/assets/placeholders/item.svg', alt: 'item.spore-chitin', pixelArt: true },
  { id: 'item.ruin-shard', path: '/assets/items/item_ruin_shard.png', fallback: '/assets/placeholders/item.svg', alt: 'item.ruin-shard', pixelArt: true },
  {
    id: 'equipment.weapon.prologue.g1',
    path: '/assets/equipment/weapon/weapon_prologue_g1.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau I',
    pixelArt: true,
  },
  {
    id: 'equipment.weapon.prologue.g2',
    path: '/assets/equipment/weapon/weapon_prologue_g2.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau II',
    pixelArt: true,
  },
  {
    id: 'equipment.weapon.prologue.g3',
    path: '/assets/equipment/weapon/weapon_prologue_g3.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau III com Joia',
    pixelArt: true,
  },
  ...([4, 5, 6, 7] as const).map((grade) => ({
    id: `equipment.weapon.prologue.g${grade}`,
    path: `/assets/equipment/weapon/weapon_prologue_g${grade}.png`,
    fallback: '/assets/placeholders/weapon.svg',
    alt: `Arma básica vinculada, Grau ${grade}`,
    pixelArt: true,
  })),
  {
    id: 'item.fungal-nucleus',
    path: '/assets/items/item_fungal_nucleus.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Núcleo Fúngico',
    pixelArt: true,
  },
  {
    id: 'item.spore-cluster',
    path: '/assets/items/item_spore_cluster.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Aglomerado de Esporos',
    pixelArt: true,
  },
  {
    id: 'item.minor-tonic',
    path: '/assets/items/item_minor_tonic.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Tônico de Campo',
    pixelArt: true,
  },
  ...(['simple-ether', 'field-compress', 'antidote'] as const).map((item) => ({
    id: `item.${item}`,
    path: `/assets/items/item_${item.replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Ícone de ${item}`,
    pixelArt: true,
  })),
  {
    id: 'item.mycelial-fragment',
    path: '/assets/items/item_mycelial_fragment.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Fragmento de Essência Micelial',
    pixelArt: true,
  },
  ...gemComponentDefinitions.map((gem) => ({
    id: gem.iconAssetId,
    path: gem.id==='terra_v05171'||gem.id==='ar_v05171'?`/assets/gems/gem_${gem.id}.svg`:`/assets/gems/gem_${gem.iconAssetId.slice(4).replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: gem.name,
    pixelArt: true,
  })),
  ...(['fungal_weak', 'mycelial'] as const).map((essence) => ({
    id: `essence.${essence.replaceAll('_', '-')}`,
    path: `/assets/essences/essence_${essence}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Estudo visual da Essência ${essence}`,
    pixelArt: true,
  })),
  {
    id: 'item.quest-record',
    path: '/assets/items/item_astravel_record.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Registro de Astravél',
    pixelArt: true,
  },
  ...(['weapon', 'shield', 'armor', 'necklace', 'bracelet'] as const).map((slot) => ({
    id: `equipment.slot-preview.${slot}`,
    path: `/assets/equipment/slot-previews/${slot}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Silhueta de referência do slot ${slot}`,
    pixelArt: true,
  })),
  ...visualEquipmentCatalog.map((item) => ({
    id: item.assetId,
    path: item.assetPath,
    fallback: '/assets/placeholders/item.svg',
    alt: `Conceito pixel art: ${item.name}`,
    pixelArt: true,
    ...(item.id==='shield_quiver_v0517'?{draftPlaceholder:true as const}:{}),
  })),
]

// Only visual references. These are not bound-item definitions or inventory entries.
export const boundSlotPreviewAssetIds: Record<BoundSlot, string> = {
  weapon: 'equipment.slot-preview.weapon',
  shield: 'equipment.slot-preview.shield',
  armor: 'equipment.slot-preview.armor',
  necklace: 'equipment.slot-preview.necklace',
  bracelet: 'equipment.slot-preview.bracelet',
}

export const assetRegistry = Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<
  string,
  AssetEntry
>

export const resolveAsset = (assetId: string): AssetEntry =>
  assetRegistry[assetId] ?? {
    id: assetId,
    path: FALLBACK,
    fallback: FALLBACK,
    alt: `Asset pendente: ${assetId}`,
  }
