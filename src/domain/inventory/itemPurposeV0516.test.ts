import {describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave} from '../game/createSave'
import {getMaterialTradeImpactV0516} from './itemPurpose'
describe('v0.5.16 — trade preview',()=>{
 it('mostra falta e NPC sem consumir',()=>{
  const s=createNewSave('trade','Nexo','character.terririan.default',content)
  const q=content.quests.delivery_arlen_nuclei,id=q.turnInItems![0].itemId
  s.quests[q.id].status='active'
  s.inventory.push({instanceId:'x',definitionId:id,quantity:3,rarity:content.items[id].rarity,locked:false,favorite:false,acquiredAt:s.createdAt})
  const before=structuredClone(s),r=getMaterialTradeImpactV0516(id,3,s,content)
  expect(r.missingAfter).toBe(q.turnInItems![0].quantity)
  expect(r.deliveries[0].npcName).toBe(content.npcs[q.turnInNpcId].name)
  expect(s).toEqual(before)
 })
})
