/// <reference types="node"/>
import {existsSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBoundItem} from '../bond/boundItems'
import {createBattle,submitBattleCommand} from './engine'
import {applyLayeredProtectionV0517,deriveOffhandCombatV0517,getInitiativeModifiersV0517,getEffectiveInitiativeV0517} from './layeredDefenseV0517'
import {gameSaveSchema} from '../../persistence/saveSchema'
import {resolveAsset} from '../../assets/assetRegistry'
import {extraCombatSkillsV0517,extraCombatStatusesV0517} from '../../content/combatAdvancementsV0517'
import {previewCombatSkill} from './skillPreview'
const now='2026-11-13T15:00:00Z'
const make=(weapon='bound_weapon_long_sword')=>{
 const s=createNewSave('qa-layer','Teste','character.terririan.default',content,now)
 s.character.attributes.vigor.die=6
 s.character.attributes.strength.die=8
 s.character.attributes.agility.die=6
 s.character.attributes.cunning.die=6
 s.character.attributes.spirit.die=6
 const result=bindPrologueWeapon(s,content,now,'qa-layer-weapon',weapon)
 if(!result.ok)throw Error(result.message)
 return result.value
}
function equipShield(save:ReturnType<typeof make>,itemId:string){
 const item=createBoundItem(save.character.id,content.boundItemBases[itemId],now,'test-'+itemId)
 save.boundItems[item.id]=item
 save.character.bondedEquipment.shield=item.id
 return save
}
describe('v0.5.17 Escudaria — proteção e iniciativa',()=>{
 it('escudo possui limiar passivo: dano só chega ao HP se superar ESC',()=>{
  const s=equipShield(make(),'bound_shield_round')
  const b=createBattle(s,content.encounters.encounter_fungorro_01,content,'guard-threshold')
  const p=b.combatants.combatant_player
  expect(p.offhandKind).toBe('shield')
  expect(p.physicalGuard).toBe(2)
  expect(applyLayeredProtectionV0517(p,2,'physical')).toMatchObject({shieldAbsorbed:2,hpDamage:0})
  expect(applyLayeredProtectionV0517(p,7,'physical')).toMatchObject({shieldAbsorbed:2,hpDamage:5})
  expect(p.arcaneGuard).toBe(0)
 })
 it('Protetor Arcano absorve magia em reserva consumível, sem criar slot extra',()=>{
  const s=equipShield(make('bound_weapon_arcane_scepter'),'bound_shield_arcane')
  const b=createBattle(s,content.encounters.encounter_fungorro_01,content,'magic-ward')
  const p=b.combatants.combatant_player
  expect(p.offhandKind).toBe('arcane')
  expect(p.arcaneGuard).toBeGreaterThan(0)
  const original=p.arcaneGuard!
  const blocked=applyLayeredProtectionV0517(p,original+3,'arcane')
  expect(blocked.arcaneAbsorbed).toBe(original)
  expect(blocked.hpDamage).toBe(3)
  expect(p.arcaneGuard).toBe(0)
  expect(p.physicalGuard).toBe(0)
 })
 it('Aljava ocupa exatamente o slot shield e não concede escudo físico',()=>{
  const s=equipShield(make('bound_weapon_long_bow'),'bound_shield_quiver_v0517')
  const b=createBattle(s,content.encounters.encounter_fungorro_01,content,'quiver-guard')
  const p=b.combatants.combatant_player
  expect(Object.keys(s.character.bondedEquipment)).toHaveLength(5)
  expect(p.offhandKind).toBe('quiver')
  expect(p.combatProfile).toBe('archer')
  expect(p.physicalGuard).toBe(0)
  expect(p.skillIds).toContain('skill_quiver_focus_v0517')
  expect(gameSaveSchema.safeParse({...s,battle:b}).success).toBe(true)
 })
 it('Dûn’Avar conjura ARC sem renunciar ao ESC; Terrírian sem Clã não aprende o rito',()=>{
  const raw=equipShield(make(),'bound_shield_round')
  expect(deriveOffhandCombatV0517(raw,content).arcaneGuard).toBe(0)
  const initial=createBattle(raw,content.encounters.encounter_fungorro_01,content,'dunavar-not-joined')
  expect(initial.combatants.combatant_player.skillIds).not.toContain('skill_clan_dunavar_arcane_shield_v0517')
  raw.character.clan.clanId='dunavar'
  const b=createBattle(raw,content.encounters.encounter_fungorro_01,content,'dunavar-joined',{manualInitiative:true})
  const p=b.combatants.combatant_player
  expect(p.skillIds).toContain('skill_clan_dunavar_arcane_shield_v0517')
  expect(p.physicalGuard).toBe(2)
  expect(p.arcaneGuard).toBeGreaterThanOrEqual(1)
  b.phase='AwaitingAction'
  b.actorId=p.id
  b.initiativeOrder=[p.id,...b.initiativeOrder.filter(id=>id!==p.id)]
  b.actorCursor=0
  const outcome=submitBattleCommand(b,{type:'skill',skillId:'skill_clan_dunavar_arcane_shield_v0517',targetId:p.id},content)
  expect(outcome.ok).toBe(true)
  if(outcome.ok)expect(outcome.value.log.some(x=>x.message.includes('conjura Proteção Arcana'))).toBe(true)
 })
 it('status modifica dado de iniciativa e total sem se tornar crítico gratuito',()=>{
  const b=createBattle(make(),content.encounters.encounter_fungorro_01,content,'status-initiative',{manualInitiative:true})
  const p=b.combatants.combatant_player
  p.statusEffects.push({definitionId:'status_haste_v0517',sourceId:p.id,remainingTurns:2})
  expect(getInitiativeModifiersV0517(p,content)).toMatchObject({flat:2,steps:1,die:8})
  const result=submitBattleCommand(b,{type:'rollInitiative'},content)
  expect(result.ok).toBe(true)
  if(!result.ok)return
  expect(result.value.log.some(entry=>entry.message.includes('rola iniciativa: d8'))).toBe(true)
  expect(result.value.combatants.combatant_player.initiativeRolledBase).toBeDefined()
  p.initiativeRolledBase=20
  p.statusEffects=[{definitionId:'status_slow_v0517',sourceId:p.id,remainingTurns:2}]
  expect(getEffectiveInitiativeV0517(p,content)).toBe(16) // -2 flat, -2 expected delta from one die step
 })
 it('Aparar de duelista tem chance de dado superior, sem inventar Classe',()=>{
  const sword=createBattle(make(),content.encounters.encounter_fungorro_01,content,'duelist-stance')
  const duelist=sword.combatants.combatant_player
  expect(duelist.combatProfile).toBe('duelist')
  const target=Object.values(sword.combatants).find(x=>x.side==='enemy')!
  const skill=content.combatSkills.skill_nexus_parry_v0517
  const actual=previewCombatSkill(duelist,target,skill,content)
  const untrained=previewCombatSkill({...duelist,combatProfile:'untrained'},target,skill,content)
  expect(actual.reaction!.chance).toBeGreaterThan(untrained.reaction!.chance)
 })
 it('todos os novos sprites carregam IDs e arquivos SVG de pixel art distintos',()=>{
  const ids=[
   ...extraCombatSkillsV0517.map(skill=>'skill.'+skill.id),
   ...extraCombatStatusesV0517.map(status=>'status.'+status.id),
   'equipment.offhand.quiver_v0517',
   ...['blade','axe','bow','dagger','arcaneFocus','grimoire','staff'].flatMap(x=>
     ['single','area'].map(n=>'action.weapon.'+x+'.'+n)),
  ]
  for(const id of ids){
   const asset=resolveAsset(id)
   expect(asset.pixelArt,id).toBe(true)
   expect(asset.path,id).toMatch(/\.svg$/)
   const file=join(process.cwd(),'public',asset.path.slice(1))
   expect(existsSync(file),id).toBe(true)
   expect(readFileSync(file,'utf8'),id).toContain('shape-rendering="crispEdges"')
  }
 })
})
