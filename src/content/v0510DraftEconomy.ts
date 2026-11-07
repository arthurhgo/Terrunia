/**
 * v0.5.10 BALANCE_DRAFT: proposed rarity and linked-item rune metadata.
 * NOT a live loot table. Enabling a source requires an owner-approved enemy,
 * idempotent battle reward transaction and a registered InventoryItemDefinition.
 * Never give a permanent linked weapon or Epic Soul Rune-Jewel as a drop.
 */
export type RareSourceDraft = {
  id: string; biome: string; name: string; eligibleSource: string; chance: number
  enabled: false
}
const rare = (id: string, name: string, biome: string, source: string, chance: number): RareSourceDraft =>
  ({ id, name, biome, eligibleSource: source, chance, enabled: false })
export const rareDropDrafts: readonly RareSourceDraft[] = [
  rare('drop_astravel_prismatic_spore', 'Esporo Prismático', 'Astravél', 'Semeador de Esporos / Louva-Esporos', .015),
  rare('drop_astravel_blackroot_seed', 'Semente Raiz-Negra', 'Astravél', 'Titan Raiz-Negra repetível', .009),
  rare('rune_cure', 'Runa da Cura', 'Astravél', 'Caçada de Esporos', .006),
  rare('rune_blood', 'Runa do Sangue', 'Astravél', 'Rastro Micelial', .0035),
  rare('rune_preservation', 'Runa de Preservação', 'Astravél', 'Guardiões do Limiar', .0025),
  rare('drop_cerrado_crystal_cactus_core', 'Núcleo de Cacto-Cristal', 'Cerrado Místico', 'Coleta ambiental', .012),
  rare('drop_cerrado_storm_scale', 'Escama Tempestuosa', 'Cerrado Místico', 'Serpente-Tempestade', .008),
  rare('rune_vigor', 'Runa do Vigor', 'Cerrado Místico', 'Elite do Cerrado', .007),
  rare('rune_speed', 'Runa da Velocidade', 'Cerrado Místico', 'Lagarto-Sombra', .0045),
  rare('rune_whispering_wind', 'Runa do Vento Sussurrante', 'Cerrado Místico', 'Serpente-Tempestade', .0025),
  rare('drop_elduran_intact_stinger', 'Ferrão de Aço Intacto', 'Elduran', 'Escorpião-Aço', .01),
  rare('drop_elduran_mirage_crystal', 'Cristal de Miragem', 'Elduran', 'Golem de Areia', .007),
  rare('rune_mana', 'Runa da Mana', 'Elduran', 'Golem de Areia', .006),
  rare('rune_fire', 'Runa do Fogo', 'Elduran', 'Serpente Solar', .003),
  rare('rune_sealing', 'Runa de Selamento', 'Elduran', 'Ruína repetível', .002),
  rare('drop_glacial_ancient_core', 'Núcleo Glaciar Ancestral', 'Glacial', 'Aguaverno', .009),
  rare('drop_glacial_frozen_lily', 'Lírio-Congelado Perfeito', 'Glacial', 'Coleta ambiental', .007),
  rare('rune_regeneration', 'Runa de Regeneração', 'Glacial', 'Ursídrio Branco', .0065),
  rare('rune_purification', 'Runa da Purificação', 'Glacial', 'Garra-Espectral', .0035),
  rare('material_glacial_shield_seal', 'Lacre de Escudo Glacial', 'Glacial', 'Ruína repetível', .003),
  rare('drop_korduun_roc_feather', 'Pena de Roc Arcano', 'Korduun', 'Roc Errante', .009),
  rare('drop_korduun_granite_heart', 'Coração Granítico', 'Korduun', 'Golem de Granito', .0075),
  rare('rune_shield', 'Runa do Escudo', 'Korduun', 'Golem de Granito', .0055),
  rare('rune_ruin', 'Runa da Ruína', 'Korduun', 'Templo repetível', .002),
  rare('fragment_rune_superior_incomplete', 'Inscrição Superior Incompleta', 'Korduun', 'Eco tardio / Grau VI', .0015),
]

export type BoundRuneDraft = {
  id: string; name: string; minGrade: 4; weaponBonusDraft: string; armorBonusDraft: string
  status: 'BALANCE_DRAFT'
}
const rune = (id: string, name: string, weaponBonusDraft: string, armorBonusDraft: string): BoundRuneDraft =>
  ({ id, name, minGrade: 4, weaponBonusDraft, armorBonusDraft, status: 'BALANCE_DRAFT' })
export const boundRuneDrafts: readonly BoundRuneDraft[] = [
  rune('rune_cure', 'Runa da Cura', '+1 cura ao usar habilidade de cura', '+2 Vida máxima'),
  rune('rune_regeneration', 'Runa de Regeneração', 'Recuperar 1 Vida após habilidade (1x/turno)', 'Recuperar 1 Vida a cada 3 turnos'),
  rune('rune_mana', 'Runa da Mana', '−1 MP em habilidade compatível (mín. 1)', '+2 Mana máxima'),
  rune('rune_shield', 'Runa do Escudo', '+1 Guarda em postura defensiva', '+1 Mitigação'),
  rune('rune_vigor', 'Runa do Vigor', '+1 dano em técnica pesada', '+2 Vida máxima'),
  rune('rune_blood', 'Runa do Sangue', '+1 cura por acerto (1x/turno)', '+1 redução de dano com Vida baixa'),
  rune('rune_purification', 'Runa da Purificação', 'Remove 1 status nocivo por técnica', 'Remove 1 status nocivo (1x/combate)'),
  rune('rune_fire', 'Runa do Fogo', 'Chance de Queimadura (taxa provisória)', '+1 Mitigação contra queimadura'),
  rune('rune_speed', 'Runa da Velocidade', '+1 Iniciativa', '+1 Iniciativa'),
  rune('rune_ruin', 'Runa da Ruína', '+1 dano contra corrupção', '+1 Mitigação contra corrupção'),
  rune('rune_sealing', 'Runa de Selamento', 'Reduz duração de status por técnica', '+1 Mitigação arcana situacional'),
  rune('rune_preservation', 'Runa de Preservação', '+1 Guarda em habilidade defensiva', '+1 Vida máxima situacional'),
  rune('rune_whispering_wind', 'Runa do Vento Sussurrante', '+1 Iniciativa por técnica associada', '+1 Iniciativa'),
]

/** Fail-closed until percentages, drops, effects and slot policy are approved. */
export const getLiveRareDrops = () => rareDropDrafts.filter((entry) => entry.enabled)
