import type {ItemDefinition} from './types'

/** v0.5.17.1: modules are consumable temporary resources, NOT additional Bonds. */
export const MODULAR_FAMILIES_V05171=['blade','axe','bow','dagger','arcaneFocus','grimoire','staff','shield'] as const
export type ModularFamilyV05171=typeof MODULAR_FAMILIES_V05171[number]
export const MODULAR_SLOTS_V05171=['body','handle','coreHousing','focusMount'] as const
export type ModularSlotV05171=typeof MODULAR_SLOTS_V05171[number]
export type ModularTierV05171=1|2|3|4|5
export type WeaponPartDefinitionV05171={
 id:string;name:string;family:ModularFamilyV05171;slot:ModularSlotV05171
 tier:ModularTierV05171;price:number;forgeGold:number;assetId:string
 recommendedStyle:'guerreiro'|'arqueiro'|'mago'|'defesa'
 /** Material bonuses are not Essence/Jewel/Runes or extra permanent Bonds. */
 bonus:'attack'|'initiative'|'guard'|'arcane'|'parry'|'dodge'|'block'|'shieldStrike'
}
const labels:Record<ModularFamilyV05171,[string,string,string,string,string]>={
 blade:['Espada','Lâmina','Punho e Guarda','Câmara de Ressonância','Encaixe de Joia'],
 axe:['Machado','Cabeça','Cabo','Núcleo de Impacto','Soquete Rúnico'],
 bow:['Arco','Limbo','Empunhadura','Câmara de Precisão','Soquete Elemental'],
 dagger:['Adaga','Lâmina Curta','Punho','Câmara de Ressonância','Encaixe de Gema'],
 arcaneFocus:['Cetro','Coroa Arcana','Haste','Câmara do Núcleo','Suporte de Joia'],
 grimoire:['Grimório','Capa e Folhas','Fecho','Selo Central','Moldura de Joia'],
 staff:['Cajado','Corpo Condutor','Empunhadura','Núcleo Canalizador','Coroa de Foco'],
 shield:['Escudo','Armação','Alças','Camadas de Proteção','Soquete da Joia'],
}
const tiers=['','Bruto','Tratado','Refinado','Nobre','Magistral']
export const weaponPartDefinitionsV05171:WeaponPartDefinitionV05171[]=
 MODULAR_FAMILIES_V05171.flatMap(family=>MODULAR_SLOTS_V05171.flatMap((slot,i)=>
  ([1,2,3,4,5] as ModularTierV05171[]).map(tier=>{
   const id='part_v05171_'+family+'_'+slot+'_t'+tier
   const style=family==='shield'?'defesa':family==='bow'?'arqueiro':
    ['arcaneFocus','grimoire','staff'].includes(family)?'mago':'guerreiro'
   const bonuses:Record<ModularFamilyV05171,readonly WeaponPartDefinitionV05171['bonus'][]>={
    blade:['attack','parry','attack','attack'],axe:['attack','attack','attack','shieldStrike'],
    bow:['attack','dodge','initiative','attack'],dagger:['attack','parry','initiative','attack'],
    arcaneFocus:['attack','initiative','arcane','attack'],
    grimoire:['attack','arcane','arcane','attack'],
    staff:['attack','parry','arcane','attack'],
    shield:['guard','block','arcane','shieldStrike'],
   }
   return {id,name:labels[family][i+1]+' '+tiers[tier]+' de '+labels[family][0],
    family,slot,tier,price:4+tier*tier*7,forgeGold:tier*4,
    assetId:'modular.'+id,bonus:bonuses[family][i],
    recommendedStyle:style as WeaponPartDefinitionV05171['recommendedStyle']}
  })))
export const weaponPartByIdV05171=Object.fromEntries(weaponPartDefinitionsV05171.map(p=>[p.id,p])) as Record<string,WeaponPartDefinitionV05171>
const rarityByTier={1:'common',2:'uncommon',3:'rare',4:'epic',5:'legendary'} as const
export const modularPartItemsV05171:ItemDefinition[]=weaponPartDefinitionsV05171.map(p=>({
 id:p.id,name:p.name,description:'Parte de montagem '+p.slot+' da família '+p.family+
  '. Tier '+p.tier+'. Leve à Casa do Ferreiro; não substitui o Vínculo permanente.',
 category:'material',rarity:rarityByTier[p.tier],convertToEssence:false,essenceValue:0,
 sellable:false,sellValue:0,questLocked:false,canInfuseBoundItem:false,combatEffects:[],
 affinityTags:['modular','tier-'+p.tier,p.family,p.slot],iconAssetId:p.assetId,status:'BALANCE_DRAFT'
}))
/** Existing canonical Ruby/Sapphire stay canonical; Earth/Air gems are proposals. */
export const modularElementalJewelItemsV05171:ItemDefinition[]=[
 ['fire','rubi_ira','Rubi Ígneo','item.modular-gem-fire'],
 ['water','safira_mares','Safira das Marés','item.modular-gem-water'],
 ['earth','gema_terra_v05171','Gema Telúrica','item.modular-gem-earth'],
 ['air','gema_ar_v05171','Gema dos Ventos','item.modular-gem-air'],
].map(([element,gemComponentId,name,iconAssetId])=>({
 id:'item_modular_gem_'+element+'_v05171',name,description:'Joia elemental para Vínculo de Grau III ou superior; não se instala no encaixe estrutural no Grau I.',
 category:'gem' as const,rarity:'rare' as const,convertToEssence:false,essenceValue:0,
 sellable:false,sellValue:0,questLocked:false,canInfuseBoundItem:false,gemComponentId,
 combatEffects:[],affinityTags:['modular','element',element],iconAssetId,status:'CONTENT_DRAFT' as const
}))
