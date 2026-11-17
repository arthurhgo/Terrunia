import {describe,it,expect} from 'vitest'
import {existsSync,readFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {MODULAR_FAMILIES,MODULAR_SLOTS,modularPartsV05171} from '../content/modularWeaponsV05171'
import {resolveAsset} from './assetRegistry'

describe('v0.5.17.1 — modular visual consistency and swappable assets',()=>{
 it('covers all 160 part definitions with real unique SVG files and 16px composable coordinates',()=>{
  expect(modularPartsV05171).toHaveLength(MODULAR_FAMILIES.length*MODULAR_SLOTS.length*5)
  const paths=new Set<string>()
  for(const part of modularPartsV05171){
   const entry=resolveAsset(part.assetId)
   const expected='/assets/modular/'+part.family+'/'+part.partSlot+'_t'+part.tier+'.svg'
   expect(entry.path,part.id).toBe(expected)
   expect(entry.fallback).toBe('/assets/placeholders/item.svg')
   expect(entry.pixelArt).toBe(true)
   expect(paths.has(entry.path),part.id).toBe(false)
   paths.add(entry.path)
   const file=resolve(process.cwd(),'public'+entry.path)
   expect(existsSync(file),part.id+' missing sprite').toBe(true)
   const svg=readFileSync(file,'utf8')
   expect(svg).toContain('viewBox="0 0 16 16"')
   expect(svg).toContain('shape-rendering="crispEdges"')
   expect(svg).not.toMatch(/<script\b|onload=/i)
  }
 })
 it('each Tier is a distinct hand-replaceable art file, not the same shared sprite alias',()=>{
  for(const family of MODULAR_FAMILIES){
   for(const slot of MODULAR_SLOTS){
    const variants=modularPartsV05171.filter(p=>p.family===family&&p.partSlot===slot)
    expect(variants).toHaveLength(5)
    const assets=variants.map(p=>resolveAsset(p.assetId).path)
    expect(new Set(assets).size).toBe(5)
    const shapes=assets.map(path=>readFileSync(resolve(process.cwd(),'public'+path),'utf8'))
    expect(new Set(shapes).size).toBe(5)
   }
  }
 })
})
