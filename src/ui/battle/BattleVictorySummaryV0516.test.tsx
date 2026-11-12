import {render,screen,cleanup} from '@testing-library/react'
import {afterEach,describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave} from '../../domain/game/createSave'
import {createBattle} from '../../domain/combat/engine'
import {BattleVictorySummaryV0516} from './BattleVictorySummaryV0516'
afterEach(cleanup)
describe('v0.5.16 — balanço de batalha',()=>{
 it('só aparece após os espólios serem coletados',()=>{
  const save=createNewSave('victory','Nexo','character.terririan.default',content)
  save.battle=createBattle(save,content.encounters.encounter_fungorro_01,content,'victory')
  save.battle.phase='Victory'
  const {rerender}=render(<BattleVictorySummaryV0516 save={save}/>)
  expect(screen.queryByLabelText('Balanço da vitória')).not.toBeInTheDocument()
  save.battle.claimed=true
  rerender(<BattleVictorySummaryV0516 save={save}/>)
  expect(screen.getByLabelText('Balanço da vitória')).toHaveTextContent('ESPÓLIOS RECOLHIDOS')
 })
})
