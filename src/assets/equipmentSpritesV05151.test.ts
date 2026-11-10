/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { equipmentOffersV0515, gearSpriteId } from '../content/equipmentV0515'
import { castleGearMerchantsV05151 } from '../content/castleMerchantsV05151'
import { assetRegistry, resolveAsset } from './assetRegistry'

type SpriteManifest = {
  schemaVersion: string
  pixelSize: number
  equipmentCount: number
  grades: number
  merchantCount: number
  entries: Array<{assetId:string; path:string; grade:number; slot:string; tier:number; width:number; height:number}>
}
const absolute=(path:string)=>join(process.cwd(),'public',path.replace(/^\//,''))
const file=(path:string)=>readFileSync(absolute(path))
const manifest=()=>JSON.parse(readFileSync(join(process.cwd(),'public/assets/equipment/v05151/manifest.json'),'utf8')) as SpriteManifest

describe('v0.5.15.1 equipment sprite packs',()=>{
  it('generates 4200 original PNGs with 1400 distinct catalog SKUs x three forge grades',()=>{
    const m=manifest()
    expect(m.schemaVersion).toBe('0.5.15.1')
    expect(m.equipmentCount).toBe(1400)
    expect(m.grades).toBe(3)
    expect(m.entries).toHaveLength(4200)
    expect(new Set(m.entries.map(entry=>entry.assetId)).size).toBe(4200)
    expect(new Set(m.entries.map(entry=>entry.path)).size).toBe(4200)
    for(const offer of equipmentOffersV0515)for(const grade of [1,2,3] as const){
      const asset=resolveAsset(gearSpriteId(offer,grade))
      expect(asset.pixelArt,asset.id).toBe(true)
      expect(asset.draftPlaceholder,asset.id).toBeUndefined()
      expect(existsSync(absolute(asset.path)),asset.id).toBe(true)
    }
  })

  it('stores actual 32px RGBA sprites and shows visible visual transitions on forging',()=>{
    for(const offer of equipmentOffersV0515.filter((_,index)=>index%53===0)){
      const pngs=([1,2,3] as const).map(grade=>file(resolveAsset(gearSpriteId(offer,grade)).path))
      for(const png of pngs){
        expect(png.subarray(1,4).toString('ascii')).toBe('PNG')
        expect(png.readUInt32BE(16)).toBe(32)
        expect(png.readUInt32BE(20)).toBe(32)
        expect(png[25]).toBe(6)
      }
      expect(pngs[0].equals(pngs[1])).toBe(false)
      expect(pngs[1].equals(pngs[2])).toBe(false)
    }
  })

  it('creates 16 unique merchant identities and 16 native portrait PNGs',()=>{
    expect(castleGearMerchantsV05151).toHaveLength(16)
    expect(manifest().merchantCount).toBe(16)
    const sourceFiles=castleGearMerchantsV05151.map(merchant=>resolveAsset(merchant.portraitAssetId).path)
    expect(new Set(sourceFiles).size).toBe(16)
    for(const path of sourceFiles){
      expect(existsSync(absolute(path)),path).toBe(true)
      expect(file(path).readUInt32BE(16),path).toBe(32)
    }
    expect(Object.values(assetRegistry).filter(asset=>asset.id.startsWith('npc.castle-merchant.'))).toHaveLength(16)
  })
})
