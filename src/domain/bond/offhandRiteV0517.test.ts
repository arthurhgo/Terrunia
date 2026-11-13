import {describe,it,expect} from 'vitest'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {content} from '../../content/catalog'
import {checkOffhandRiteV0517,performOffhandRiteV0517,OFFHAND_RITE_V0517} from './offhandRiteV0517'
import {gameSaveSchema} from '../../persistence/saveSchema'
const NOW='2026-11-13T18:00:00Z'
function ready(){
 const raw=createNewSave('rite-qa','Terrírian','character.terririan.default',content,NOW)
 raw.character.attributes.agility.die=6
 const weapon=bindPrologueWeapon(raw,content,NOW,'weapon_rite_test','bound_weapon_long_bow')
 if(!weapon.ok)throw Error(weapon.message)
 const save=weapon.value
 save.world.currentLocationId='location_terran_bond_workshop'
 save.character.level=2
 save.character.attributes.agility.die=6
 save.wallet.gold=200
 return save
}
describe('v0.5.17 — rito inicial da Escudaria',()=>{
 it('Rito é oferecido pelo NPC real com preços parametrizados',()=>{
  expect(OFFHAND_RITE_V0517.npcId).toBe('presence_edran')
  expect(OFFHAND_RITE_V0517.offers).toHaveLength(3)
 })
 it('Aljava exige requisitos, usa apenas o slot existente, paga ouro e salva memória',()=>{
  const save=ready()
  const result=performOffhandRiteV0517(save,'bound_shield_quiver_v0517',content,NOW)
  expect(result.ok).toBe(true)
  if(!result.ok)return
  const id=result.value.character.bondedEquipment.shield!
  expect(result.value.boundItems[id].baseItemId).toBe('bound_shield_quiver_v0517')
  expect(result.value.boundItems[id].grade).toBe(1)
  expect(result.value.boundItems[id].memories[0].sourceId).toBe('offhand_rite_v0517')
  expect(result.value.wallet.gold).toBe(160)
  expect(save.character.bondedEquipment.shield).toBeNull()
  expect(gameSaveSchema.safeParse(result.value).success).toBe(true)
 })
 it('recusa troca/segunda compra após vínculo permanente',()=>{
  const first=performOffhandRiteV0517(ready(),'bound_shield_round',content,NOW)
  expect(first.ok).toBe(false) // archer does not meet Vigor d6 yet
  const save=ready()
  save.character.attributes.vigor.die=6
  const acquired=performOffhandRiteV0517(save,'bound_shield_round',content,NOW)
  expect(acquired.ok).toBe(true)
  if(!acquired.ok)return
  expect(performOffhandRiteV0517(acquired.value,'bound_shield_quiver_v0517',content,NOW))
   .toMatchObject({ok:false,code:'BOUND_SLOT_OCCUPIED'})
 })
 it('impede rito fora da oficina, sem ouro e antes do Vínculo de arma',()=>{
  const s=ready();s.world.currentLocationId='terran'
  expect(checkOffhandRiteV0517(s,'bound_shield_quiver_v0517',content).ok).toBe(false)
  s.world.currentLocationId='location_terran_bond_workshop';s.wallet.gold=0
  expect(checkOffhandRiteV0517(s,'bound_shield_quiver_v0517',content).ok).toBe(false)
  s.wallet.gold=200;s.character.bondedEquipment.weapon=null
  expect(checkOffhandRiteV0517(s,'bound_shield_quiver_v0517',content).ok).toBe(false)
 })
 it('não vincula o que não foi aprovado como oferta ou por um NPC errado',()=>{
  const s=ready()
  expect(performOffhandRiteV0517(s,'bound_weapon_long_sword',content,NOW).ok).toBe(false)
  expect(performOffhandRiteV0517(s,'bound_shield_quiver_v0517',content,NOW,'presence_neris').ok).toBe(false)
 })
})
