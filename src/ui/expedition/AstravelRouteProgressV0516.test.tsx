import {render,screen,cleanup} from '@testing-library/react'
import {afterEach,describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave} from '../../domain/game/createSave'
import {AstravelRouteProgressV0516} from './AstravelRouteProgressV0516'
afterEach(cleanup)
describe('v0.5.16 — rota visual',()=>{
 it('representa os 15 marcos sem mutar o save',()=>{
  const save=createNewSave('route-test','Nexo','character.terririan.default',content)
  save.world.trailNodeStates.astravel_fungorro_01='current'
  const snapshot=structuredClone(save)
  const {container}=render(<AstravelRouteProgressV0516 save={save}/>)
  expect(screen.getByLabelText('Progresso dos 15 marcos')).toHaveTextContent('0/15')
  expect(container.querySelectorAll('[data-node-id]')).toHaveLength(15)
  expect(container.querySelector('[data-node-id="astravel_fungorro_01"]')).toHaveAttribute('data-state','current')
  expect(save).toEqual(snapshot)
 })
})
