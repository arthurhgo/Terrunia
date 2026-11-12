import {describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {getAstravelBalanceAuditV0516} from './astravelBalanceAuditV0516'
describe('v0.5.16 — análise não invasiva dos 15 marcos',()=>{
 it('mapeia 15 confrontos, loot e curva sem alterar o catálogo',()=>{
  const original=content.trails.trail_astravel_entry.nodes.map(n=>n.id)
  const result=getAstravelBalanceAuditV0516(content)
  expect(result.stages).toHaveLength(15)
  expect(result.stages.map(s=>s.index)).toEqual(Array.from({length:15},(_,i)=>i+1))
  expect(result.stages.every(s=>s.enemyCount>0&&s.xp>=0)).toBe(true)
  expect(result.status).toBe('QA_DRAFT')
  expect(content.trails.trail_astravel_entry.nodes.map(n=>n.id)).toEqual(original)
 })
})
