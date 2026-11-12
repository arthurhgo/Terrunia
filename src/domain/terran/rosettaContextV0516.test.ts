import {describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave} from '../game/createSave'
import {getRosettaContextTipV0516} from './rosettaContextV0516'
describe('v0.5.16 — Rosetta contextual',()=>{
 it('orienta sem equipar automaticamente',()=>{
  const save=createNewSave('rosetta','Nexo','character.terririan.default',content)
  save.quests.rosetta_tutorial_supply.status='active'
  const snapshot=structuredClone(save)
  expect(getRosettaContextTipV0516(save,content)?.destination).toBe('inventory')
  expect(save).toEqual(snapshot)
 })
})
