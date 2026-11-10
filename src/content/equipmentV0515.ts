import { classDefinitions, clanDefinitions } from './progression'
import { CLAN_COMBAT_PROFILES, GEAR_STAT_LABELS, getGearStatPair, NERIS_COMBAT_PROFILES,
  type GearStat } from './equipmentProfilesV05152'
export type { GearStat } from './equipmentProfilesV05152'
import type { ItemDefinition } from './types'
import type { BoundSlot, ComplementarySlot } from '../domain/shared/types'

/** v0.5.15 · BALANCE_DRAFT · 140 sets / 1400 pieces, from approved catalog.
 * Values and assets are data-driven; clan/class gates are checked in the domain.
 */
export type GearChannel = 'PUBLIC_TERRAN' | 'CLAN_EXCLUSIVE' | 'CLASS_EXCLUSIVE'
export type GearSlot = BoundSlot | ComplementarySlot
export type GearGrade = 1 | 2 | 3
export type GearPalette = { base: string; trim: string; metallic: string; gradeThree: string; glow: string }
export type GearSet = {
  id: string; name: string; tier: number; channel: GearChannel; classId?: string
  recommendedClassId?: string; clanId?: string; castleId?: string
  level: number; palette: GearPalette; itemIds: string[]
  roleLabel?: string; roleDescription?: string
}
export type GearOffer = {
  id: string; setId: string; name: string; slot: GearSlot; tier: number; channel: GearChannel
  classId?: string; recommendedClassId?: string; clanId?: string; castleId?: string
  level: number; stat: GearStat; values: readonly [number, number, number]
  secondaryStat: GearStat; secondaryValues: readonly [number, number, number]
  price: number; forgeG2: number; forgeG3: number; palette: GearPalette; assetId: string
}
const TIERS = [1,2,3,4,5] as const
export const GEAR_LEVELS = [1,4,7,10,13] as const
const TIER_PRICE = [1,2.6,6,12,23] as const
const SLOTS:readonly GearSlot[]=['helmet','necklace','accessoryA','weapon','shield','armor','pants','boots','accessoryB','bracelet']
const LABELS=['Capacete','Colar','Talismã','Arma','Protetor','Armadura','Calças','Botas','Insígnia','Pulseira'] as const
const PRICES=[20,30,22,65,35,25,20,20,24,28] as const
/**
 * BALANCE_DRAFT v0.5.15.2: controlled power budget. Every grade improves the
 * item exactly once: G2 upgrades its support stat, G3 upgrades its main stat.
 * Unlike the previous +1/+1 *per grade*, a full kit cannot multiply both
 * damage and defense to trivialize a level-1 boss.
 */
const PRIMARY_BY_TIER=[1,2,3,4,5] as const
const SECONDARY_BY_TIER=[0,0,0,1,1] as const
const CHANNEL_PRIMARY_BONUS:Record<GearChannel,number>={
 PUBLIC_TERRAN:0,CLAN_EXCLUSIVE:1,CLASS_EXCLUSIVE:1,
}
const CHANNEL_SECONDARY_BONUS:Record<GearChannel,number>={
 PUBLIC_TERRAN:0,CLAN_EXCLUSIVE:0,CLASS_EXCLUSIVE:1,
}
const INITIAL_SECONDARY_SLOTS=new Set<GearSlot>(['weapon','armor','necklace','bracelet'])
const CASTLES:Record<string,string>={
 dunavar:'interior_clan_dunavar_castle',rustal:'interior_clan_rustal_castle',
 cebios_esti:'interior_clan_cebios_esti_castle',estres_do_et:'interior_clan_estres_do_et_castle'}
const CLANS:Record<string,readonly [string,string,string]>={
 dunavar:['Juramento da Barreira','#34544D','#CDA552'],
 rustal:['Escrita Rúnica','#53313C','#CC7E4A'],
 cebios_esti:['Rota Celestial','#284067','#A3BCDA'],
 estres_do_et:['Véu de Contenção','#4B3263','#88CDB8']}
const CLASSES:Record<string,readonly [string,string,string]>={
 sentinela_da_luz:['Vigília da Luz','#3B5C58','#D1AE4F'],
 gladiador_da_barreira:['Muralha Rubra','#6B5048','#E2934F'],
 batedor_da_vigilia:['Véu Silencioso','#2B4253','#50B69F'],
 forjador_arcano:['Ferro Arcano','#664036','#DB9253'],
 guardiao_das_inscricoes:['Inscrições Eternas','#534460','#B19CDF'],
 gravador_das_sombras:['Grafia Sombria','#2F2544','#C55FA2'],
 astrologo_celestial:['Firmamento Vivo','#284067','#8DBEF6'],
 profeta_do_orbe:['Orbe Profético','#514B81','#EFC277'],
 cacador_de_constelacoes:['Flecha Estelar','#1F5273','#48CAE4'],
 canalizador_do_caos:['Fluxo Caótico','#533165','#E26D91'],
 guardador_da_ruptura:['Fenda Selada','#41545F','#85CEAE'],
 mago_da_ruina:['Ruína Velada','#381E3F','#E9597D']}
const PUBLIC:Record<string,readonly [string,string,string,string,string,string,string]>={
 sentinela_da_luz:['#756D65','#C1B69D','Treino do Guarda','Patrulha Reforçada','Bastião de Campo','Proteção Veterana','Fortaleza Nômade'],
 gladiador_da_barreira:['#836A5C','#CEB394','Treino de Arena','Arena Temperada','Choque de Linha','Vanguarda Veterana','Duelista de Elite'],
 batedor_da_vigilia:['#717163','#BEB69B','Passo Leve','Trilha Silenciosa','Rastreador de Campo','Caçada Noturna','Predador da Trilha'],
 forjador_arcano:['#757265','#C1B69D','Oficina Pesada','Ferramentas de Campo','Malha Rebitada','Engenharia de Guerra','Construtor de Elite'],
 guardiao_das_inscricoes:['#7D726C','#C9B5A5','Aprendiz de Selo','Vestes de Vigília','Proteção Tecida','Sentinela Erudita','Arsenal de Símbolos'],
 gravador_das_sombras:['#756C6C','#C0B3A4','Escriba de Campo','Sombra de Pergaminho','Marca Oculta','Sigilo Profundo','Gravura de Elite'],
 astrologo_celestial:['#756C6C','#C0B3A4','Mapa do Aprendiz','Observador Noturno','Cálculo de Campo','Horizonte Ampliado','Ecos do Zênite'],
 profeta_do_orbe:['#7D6F6C','#C9B5A5','Leitura Inicial','Sinais de Campo','Visão Prudente','Conselheiro Superior','Presságio Refinado'],
 cacador_de_constelacoes:['#707163','#BEB69B','Arqueiro Jovem','Rota de Caça','Olho de Longe','Arco Veterano','Tiro Preciso'],
 canalizador_do_caos:['#756F6C','#C0B3A4','Condutor Iniciante','Circuito Estável','Fluxo de Campo','Condutor Avançado','Arsenal Condutor'],
 guardador_da_ruptura:['#756D65','#C1B69D','Contenção Simples','Guarda da Fenda','Barreira Portátil','Proteção Resoluta','Blindagem Regulada'],
 mago_da_ruina:['#756C6C','#C0B3A4','Conjurador Iniciante','Foco de Campo','Conjuração Afiada','Foco Superior','Artefato do Mestre']}
const CLAN_STAGES=['Vigia','Discípulo','Guardião','Mestre','Legado'] as const
const CLASS_STAGES=['Iniciação','Discipulado','Ascensão','Maestria','Legado'] as const
const rgb=(color:string)=>[0,2,4].map(i=>parseInt(color.slice(i+1,i+3),16))
const blend=(a:string,b:string,f:number)=>'#'+rgb(a).map((v,i)=>Math.round(v*(1-f)+rgb(b)[i]*f).toString(16).padStart(2,'0')).join('').toUpperCase()
const palette=(base:string,trim:string,tier:number,index:number):GearPalette=>{
 const primary=blend(base,'#FFFFFF',Math.min(.24,(tier-1)*.035+(index%3)*.012))
 return {base:primary,trim,metallic:blend(primary,'#D8D5C9',.48),gradeThree:blend(primary,trim,.20),glow:blend(trim,'#FFFFFF',.45)}
}
export const equipmentSetsV0515:GearSet[]=[]
export const equipmentOffersV0515:GearOffer[]=[]
function addSet(id:string,name:string,tier:number,channel:GearChannel,base:string,trim:string,
 classId?:string,clanId?:string,recommendedClassId?:string){
 const role=classId??recommendedClassId
 const profile=(role?NERIS_COMBAT_PROFILES[role]:undefined) ??
   (clanId?CLAN_COMBAT_PROFILES[clanId]:undefined)
 if(!profile)throw new Error('Missing combat profile for equipment set '+id)
 const set:GearSet={id,name,tier,channel,classId,clanId,recommendedClassId,
  ...(channel==='PUBLIC_TERRAN'?{roleLabel:profile.label,roleDescription:profile.description}:{}),
  ...(clanId?{castleId:CASTLES[clanId]}:{}),level:GEAR_LEVELS[tier-1],
  palette:palette(base,trim,tier,0),itemIds:[]}
 SLOTS.forEach((slot,index)=>{
  const sku=id.replace(/^set_/,'eq_')+'_'+slot.toLowerCase()
  const price=Math.round(PRICES[index]*TIER_PRICE[tier-1]*(channel==='PUBLIC_TERRAN'?1:channel==='CLAN_EXCLUSIVE'?1.1:1.2))
  const [stat,secondaryStat]=getGearStatPair(profile,slot,role)
  // Universal attack benefits either weapon type and is deliberately weaker
  // than a dedicated physical/magical bonus. Exclusive power is added after
  // that discount, preserving the stronger Class > Clan > neutral hierarchy.
  const raw=PRIMARY_BY_TIER[tier-1]+(slot==='weapon'?1:0)
  const core=stat==='attackPower'?Math.max(1,Math.floor(raw*.7)):raw
  const v=core+CHANNEL_PRIMARY_BONUS[channel]
  const initialSupport=SECONDARY_BY_TIER[tier-1]+
    (INITIAL_SECONDARY_SLOTS.has(slot)||((slot==='shield'||slot==='armor')&&secondaryStat==='mitigation')?1:0)
  const sec=initialSupport+CHANNEL_SECONDARY_BONUS[channel]
  const pal=palette(base,trim,tier,index)
  const assetId='equipment.v0515.'+(channel==='PUBLIC_TERRAN'?'terran':channel==='CLAN_EXCLUSIVE'?'clan':'class')+
   '.'+(classId??clanId??recommendedClassId)+'.'+slot+'.t'+tier+'.g1'
  const offer:GearOffer={id:sku,setId:id,name:LABELS[index]+' '+name+' — Tier '+tier,
   slot,tier,channel,classId,clanId,recommendedClassId,...(clanId?{castleId:CASTLES[clanId]}:{}),
   level:GEAR_LEVELS[tier-1],stat,values:[v,v,v+1],
   secondaryStat,secondaryValues:[sec,sec+1,sec+1],price,forgeG2:Math.round(price*.25),
   forgeG3:Math.round(price*.35),palette:pal,assetId}
  equipmentOffersV0515.push(offer);set.itemIds.push(sku)
 })
 equipmentSetsV0515.push(set)
}
for(const cls of classDefinitions){
 const pub=PUBLIC[cls.id],ex=CLASSES[cls.id]
 for(const tier of TIERS){
  addSet('set_v0515_terran_'+cls.id+'_t'+tier,pub[tier+1],tier,'PUBLIC_TERRAN',pub[0],pub[1],undefined,undefined,cls.id)
  addSet('set_v0515_class_'+cls.id+'_t'+tier,ex[0]+' · '+CLASS_STAGES[tier-1],tier,'CLASS_EXCLUSIVE',ex[1],ex[2],cls.id,cls.clanId)
 }
}
for(const clan of clanDefinitions){
 const style=CLANS[clan.id]
 for(const tier of TIERS)
  addSet('set_v0515_clan_'+clan.id+'_t'+tier,style[0]+' · '+CLAN_STAGES[tier-1],tier,'CLAN_EXCLUSIVE',style[1],style[2],undefined,clan.id)
}
export const gearOfferById=Object.fromEntries(equipmentOffersV0515.map(o=>[o.id,o])) as Record<string,GearOffer>
export const gearSetById=Object.fromEntries(equipmentSetsV0515.map(s=>[s.id,s])) as Record<string,GearSet>
export const getGearGrade=(refinementLevel?:number):GearGrade=>
 Math.max(1,Math.min(3,(refinementLevel??0)+1)) as GearGrade
export const gearValue=(offer:GearOffer,grade:GearGrade)=>offer.values[grade-1]
/** Published item defense is calculated from the actual Tier/G1–G3 catalog pair. */
export const getCommercialArmorDefense=(offer:GearOffer,grade:GearGrade)=>
 offer.stat==='mitigation'?offer.values[grade-1]:
 offer.secondaryStat==='mitigation'?offer.secondaryValues[grade-1]:0
/** UI and combat share the same effective, graded stat pair. */
export const getGearStatEntries=(offer:GearOffer,grade:GearGrade)=>[
  {stat:offer.stat,label:GEAR_STAT_LABELS[offer.stat],value:offer.values[grade-1]},
  {stat:offer.secondaryStat,label:GEAR_STAT_LABELS[offer.secondaryStat],value:offer.secondaryValues[grade-1]},
] as const
export const formatGearStats=(offer:GearOffer,grade:GearGrade)=>
 getGearStatEntries(offer,grade).map(entry=>entry.label+' +'+entry.value).join(' · ')
/** Stable registry variant for each real 32px PNG texture. */
export const gearSpriteId=(offer:GearOffer,grade:GearGrade=1)=>offer.assetId.replace(/\.g1$/,'.g'+grade)
const complementary=new Set<GearSlot>(['helmet','pants','boots','accessoryA','accessoryB'])
export const gearItemDefinitionsV0515:ItemDefinition[]=equipmentOffersV0515.map(offer=>({
 id:offer.id,name:offer.name,
 description:(offer.channel==='PUBLIC_TERRAN'?'Coleção neutra de Terran':offer.channel==='CLAN_EXCLUSIVE'?'Exclusivo de Clã':'Exclusivo de Classe')+
  ' · Tier '+offer.tier+' · Grau 1. '+formatGearStats(offer,1)+'. Pode ser combinado com outras peças.',
 category:'equipment',rarity:offer.tier>=5?'epic':offer.tier>=3?'rare':offer.tier===2?'uncommon':'common',
 convertToEssence:false,essenceValue:0,sellable:true,sellValue:Math.floor(offer.price*.35),
 questLocked:false,canInfuseBoundItem:false,combatEffects:[],
 ...(complementary.has(offer.slot)?{complementarySlot:offer.slot as ComplementarySlot}:{}),
 ...(offer.slot==='armor'?{basicArmor:{tier:offer.tier as 1|2|3|4|5,
  mitigation:offer.stat==='mitigation'?offer.values[0]:offer.secondaryStat==='mitigation'?offer.secondaryValues[0]:0,
  initiative:0,maxRefinement:2}}:{}),
 affinityTags:['gear-v0515',offer.channel,offer.slot],iconAssetId:offer.assetId,status:'BALANCE_DRAFT',
}))
export const GEAR_SUMMARY_V0515={sets:equipmentSetsV0515.length,offers:equipmentOffersV0515.length,slots:SLOTS.length} as const
