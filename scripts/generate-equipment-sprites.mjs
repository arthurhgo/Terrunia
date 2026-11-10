/**
 * Terrúnia v0.5.15.1 — deterministic original 32x32 pixel-art PNGs.
 * 1,400 equipment SKUs x 3 forge grades = 4,200 final sprites, plus 16 NPC portraits.
 * This tool reads the authoritative TypeScript catalogs; no divergent art inventory.
 * Generated files are build artifacts and may be replaced individually by hand.
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'
import ts from 'typescript'

const root = process.cwd()
const cache = new Map()
function loadLocalModule(file) {
  const path = resolve(root, file)
  if (cache.has(path)) return cache.get(path).exports
  const module = { exports: {} }
  cache.set(path, module)
  const output = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: path,
  }).outputText
  const localRequire = (specifier) => {
    if (!specifier.startsWith('.')) throw Error('Unexpected generator import: ' + specifier)
    const dependency = resolve(dirname(path), specifier)
    return loadLocalModule(dependency + '.ts')
  }
  new Function('exports', 'require', 'module', output)(module.exports, localRequire, module)
  return module.exports
}
const { equipmentOffersV0515 } = loadLocalModule('src/content/equipmentV0515.ts')
const { castleGearMerchantsV05151 } = loadLocalModule('src/content/castleMerchantsV05151.ts')
const destination = join(root, 'public/assets/equipment/v05151')
const npcDestination = join(root, 'public/assets/npcs/castle_merchants')
mkdirSync(destination, { recursive: true })
mkdirSync(npcDestination, { recursive: true })
const SIZE = 32

function color(hex) {
  const h = hex.replace('#','')
  return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255]
}
function mix(a,b,f) { return a.map((v,i)=>i===3?255:Math.round(v*(1-f)+b[i]*f)) }
const INK = color('#18202A')
const DEEP = color('#283040')
const WHITE = color('#FFF5D9')
function seeded(text) {
  let value = 2166136261
  for (let i=0;i<text.length;i++) value = Math.imul(value ^ text.charCodeAt(i), 16777619)
  return value >>> 0
}
const CRC_TABLE = Array.from({length:256},(_,i)=>{
  let c=i
  for (let j=0;j<8;j++) c = c&1 ? 0xedb88320^(c>>>1) : c>>>1
  return c>>>0
})
function chunk(type,data) {
  const tag=Buffer.from(type)
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length)
  let crc=0xffffffff
  for (const b of Buffer.concat([tag,data])) crc=CRC_TABLE[(crc^b)&255]^(crc>>>8)
  const trailer=Buffer.alloc(4);trailer.writeUInt32BE((crc^0xffffffff)>>>0)
  return Buffer.concat([length,tag,data,trailer])
}
function writePng(file, pixels) {
  const header=Buffer.alloc(13)
  header.writeUInt32BE(SIZE,0);header.writeUInt32BE(SIZE,4)
  header[8]=8;header[9]=6
  const raw=Buffer.alloc((SIZE*4+1)*SIZE)
  for(let y=0;y<SIZE;y++){
    const offset=y*(SIZE*4+1)
    raw[offset]=0
    Buffer.from(pixels.buffer,pixels.byteOffset+y*SIZE*4,SIZE*4).copy(raw,offset+1)
  }
  writeFileSync(file,Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',header),chunk('IDAT',deflateSync(raw,{level:6})),chunk('IEND',Buffer.alloc(0))
  ]))
}
function canvas() {
  const pixels = new Uint8Array(SIZE*SIZE*4)
  const set=(x,y,rgba)=>{
    x=Math.round(x);y=Math.round(y)
    if(x<0||x>=SIZE||y<0||y>=SIZE)return
    const i=(y*SIZE+x)*4
    for(let n=0;n<4;n++)pixels[i+n]=rgba[n]
  }
  const rect=(x,y,w,h,c)=>{
    for(let yy=Math.round(y);yy<y+h;yy++)for(let xx=Math.round(x);xx<x+w;xx++)set(xx,yy,c)
  }
  const line=(x1,y1,x2,y2,c,thick=1)=>{
    const steps=Math.max(Math.abs(x2-x1),Math.abs(y2-y1),1)*2
    for(let i=0;i<=steps;i++){
      const f=i/steps
      rect(Math.round(x1+(x2-x1)*f),Math.round(y1+(y2-y1)*f),thick,thick,c)
    }
  }
  const poly=(points,c)=>{
    const ymin=Math.min(...points.map(p=>p[1]))
    const ymax=Math.max(...points.map(p=>p[1]))
    const xmin=Math.min(...points.map(p=>p[0]))
    const xmax=Math.max(...points.map(p=>p[0]))
    for(let y=Math.floor(ymin);y<=ymax;y++)for(let x=Math.floor(xmin);x<=xmax;x++){
      let inside=false
      for(let i=0,j=points.length-1;i<points.length;j=i++){
        const a=points[i],b=points[j]
        if((a[1]>y)!==(b[1]>y) && x < (b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside
      }
      if(inside)set(x,y,c)
    }
  }
  const frame=(x,y,w,h,c,border=INK)=>{rect(x-1,y-1,w+2,h+2,border);rect(x,y,w,h,c)}
  return {pixels,set,rect,line,poly,frame}
}
function paintGear(gear,grade) {
  const c=canvas(),h=seeded(gear.id)
  const base=color(grade===3?gear.palette.gradeThree:gear.palette.base)
  const trim=color(gear.palette.trim), metal=color(grade===1?gear.palette.trim:gear.palette.metallic)
  const shine=color(grade===3?gear.palette.glow:grade===2?'#F4E7C8':'#DCCFBB')
  const shade=mix(base,DEEP,.43), light=mix(base,WHITE,.36)
  const dark=mix(base,INK,.67)
  const {rect:r,line:l,poly:p,set,frame:f}=c
  const jewel=(x,y)=>{
    f(x,y,4,4,trim)
    r(x+1,y,2,1,shine);set(x+1,y+2,shade)
  }
  const runes=(x,y)=>{
    const style=h%4
    if(style===0){l(x,y,x+3,y+3,shine);l(x+3,y,x,y+3,metal)}
    if(style===1){r(x+1,y,2,4,metal);r(x,y+1,4,1,shine)}
    if(style===2){l(x+1,y,x+3,y+2,metal);l(x+3,y+2,x+1,y+4,shine)}
    if(style===3){r(x,y+1,4,1,shine);r(x+1,y,2,4,metal)}
  }
  switch(gear.slot) {
    case 'helmet':{
      p([[7,17],[8,10],[12,6],[20,6],[24,10],[25,17],[23,23],[9,23]],INK)
      p([[9,17],[10,11],[13,8],[19,8],[22,11],[23,17],[21,21],[11,21]],base)
      r(11,11,10,2,light);r(8,16,16,2,metal);r(11,19,10,2,dark)
      r(12,17,8,2,INK);r(13,17,6,1,trim)
      if(gear.tier>=2){l(7,13,4,8,metal,2);l(24,13,27,8,metal,2)}
      if(gear.tier>=4){l(12,7,11,3,shine);l(20,7,21,3,shine)}
      runes(14,10)
      break
    }
    case 'necklace':{
      for(let i=0;i<11;i++){const x=6+i*2,y=8+Math.round(Math.abs(i-5)*1.5);r(x,y,2,3,INK);set(x,y,metal)}
      p([[12,19],[20,19],[22,24],[16,29],[10,24]],INK)
      p([[13,21],[19,21],[20,24],[16,27],[12,24]],base);jewel(14,22)
      if(gear.tier>=3){set(16,17,shine);set(8,15,trim);set(24,15,trim)}
      break
    }
    case 'accessoryA':{
      p([[10,9],[20,9],[26,15],[26,21],[20,27],[10,27],[5,21],[5,15]],INK)
      p([[11,11],[20,11],[24,16],[24,20],[19,25],[11,25],[7,20],[7,16]],metal)
      p([[13,13],[18,13],[22,17],[18,22],[13,22],[9,18]],base)
      jewel(14,16);r(12,12,8,1,shine);if(gear.tier>=3)r(8,7,16,2,trim)
      break
    }
    case 'weapon':{
      if((h%5)===0){
        l(13,5,21,27,INK,4);l(14,5,20,26,metal,2);l(7,12,20,12,INK,3);l(8,11,19,11,shine,2)
        jewel(11,8)
      }else if((h%5)===1){
        l(12,27,21,4,INK,4);l(13,26,20,5,metal,2);r(10,22,12,2,trim);r(15,25,3,5,dark)
        jewel(17,4)
      }else{
        l(19,4,12,26,INK,5);l(19,5,13,24,metal,3);l(19,5,16,13,shine,1)
        l(7,19,22,22,INK,3);l(8,19,21,21,trim,2);r(10,24,3,5,dark)
        if(gear.tier>=4)jewel(15,8)
      }
      break
    }
    case 'shield':{
      p([[8,6],[23,6],[27,10],[25,22],[16,29],[6,22],[5,10]],INK)
      p([[9,8],[22,8],[25,11],[23,21],[16,27],[8,21],[7,11]],metal)
      p([[11,11],[21,11],[22,20],[16,24],[10,20]],base)
      l(16,8,16,25,shine);l(8,15,24,15,dark);jewel(14,14)
      if(gear.tier>=3){r(9,8,3,3,trim);r(20,8,3,3,trim)}
      break
    }
    case 'armor':{
      p([[8,7],[12,5],[20,5],[25,7],[28,13],[24,17],[24,27],[8,27],[8,17],[4,13]],INK)
      p([[10,8],[13,7],[19,7],[22,8],[25,13],[22,16],[22,25],[10,25],[10,16],[7,13]],base)
      r(5,11,6,5,shade);r(22,11,6,5,shade);r(12,9,8,6,metal)
      r(12,17,8,8,dark);r(11,22,10,2,trim);l(15,9,15,23,light,2)
      if(gear.tier>=2){r(4,10,6,2,metal);r(23,10,6,2,metal)}
      if(gear.tier>=4){r(12,6,8,2,shine);jewel(14,13)}
      runes(14,18)
      break
    }
    case 'pants':{
      p([[8,6],[24,6],[24,11],[21,28],[16,28],[15,18],[14,28],[8,28],[7,20]],INK)
      p([[10,8],[22,8],[22,11],[19,26],[17,26],[16,16],[13,26],[10,26],[9,19]],base)
      r(9,9,14,3,metal);r(10,14,4,10,shade);r(18,14,3,10,shade)
      r(11,25,3,2,trim);r(18,25,3,2,trim)
      runes(14,8);break
    }
    case 'boots':{
      f(7,10,7,12,base);f(18,10,7,12,base)
      p([[7,19],[14,19],[15,24],[17,26],[17,28],[4,28],[4,25]],INK)
      p([[8,20],[13,20],[14,25],[15,26],[6,26]],metal)
      p([[18,19],[25,19],[28,25],[28,28],[15,28],[15,26]],INK)
      p([[19,20],[24,20],[26,26],[18,26]],metal)
      r(8,12,5,2,shine);r(19,12,5,2,shine);r(6,27,9,1,trim);r(18,27,9,1,trim)
      break
    }
    case 'accessoryB':{
      p([[16,3],[21,10],[28,15],[21,20],[16,29],[11,20],[4,15],[11,10]],INK)
      p([[16,6],[20,12],[25,15],[20,18],[16,26],[12,18],[7,15],[12,12]],base)
      l(16,8,16,25,metal,2);l(8,15,24,15,metal,2);jewel(14,13)
      if(gear.tier>=3){r(14,4,4,2,shine);r(6,13,2,4,trim);r(24,13,2,4,trim)}
      break
    }
    case 'bracelet':{
      p([[7,10],[25,10],[27,12],[27,22],[25,25],[7,25],[5,22],[5,12]],INK)
      r(8,11,16,13,base);r(7,13,18,3,metal);r(7,21,18,3,metal)
      r(11,15,10,6,shade);jewel(14,15)
      if(gear.tier>=3){r(8,9,16,2,trim);r(8,25,16,2,trim)}
      runes(11,17);break
    }
    default: throw Error('Unrecognized gear slot '+gear.slot)
  }
  // Pixel engraved insignia differs deterministically by class, tier and lineage.
  const sigil = seeded(gear.id + ':sigil')
  for(let i=0;i<5;i++){
    const x=9+((sigil >>> (i*5)) % 14)
    const y=9+((sigil >>> (i*3+1)) % 13)
    if(c.pixels[(y*SIZE+x)*4+3])set(x,y,i%2?metal:light)
  }
  if(grade>=2)for(let i=0;i<3;i++){const x=9+(seeded(gear.id+'g2'+i)%14);set(x,7,shine)}
  if(grade===3){
    for(const [x,y] of [[4,6],[27,7],[3,24],[28,25]]) {set(x,y,shine);set(x+1,y,mix(shine,trim,.3))}
    if(gear.tier>=4){set(15,2,shine);set(16,3,trim)}
  }
  return c.pixels
}
function paintMerchant(merchant) {
  const c=canvas(),h=seeded(merchant.id)
  const offer=equipmentOffersV0515.find(gear=>gear.clanId===merchant.clanId && gear.channel===merchant.channel)
  const base=color(offer?.palette.base??'#445466')
  const trim=color(offer?.palette.trim??'#CDBA85')
  const cloak=mix(base,INK,.38)
  const skin=color(['#CA9B72','#D9AD86','#AF8065','#DDB893'][h%4])
  const hair=color(['#392E34','#BBA27B','#61534C','#2C2533'][h%4])
  c.poly([[9,19],[23,19],[26,30],[6,30]],INK)
  c.poly([[11,20],[21,20],[24,29],[8,29]],cloak)
  c.rect(14,18,4,3,skin)
  c.rect(12,8,9,11,INK);c.rect(13,9,7,9,skin)
  c.rect(11,8,11,4,hair);c.rect(11,10,2,6,hair);c.rect(21,10,2,6,hair)
  c.rect(13,15,2,1,INK);c.rect(19,15,2,1,INK)
  c.rect(14,20,4,8,base);c.rect(15,22,2,4,trim)
  c.rect(7,21,4,7,base);c.rect(21,21,4,7,base)
  c.rect(6,26,5,2,trim);c.rect(21,26,5,2,trim)
  c.rect(13,19,7,2,trim)
  c.rect(16,22,2,2,WHITE)
  if(merchant.channel==='CLASS_EXCLUSIVE'){c.rect(12,6,10,3,trim);c.rect(15,4,4,3,base)}
  else {c.rect(10,7,12,2,trim);c.rect(8,9,3,6,trim);c.rect(22,9,3,6,trim)}
  return c.pixels
}

let produced=0
const manifest=[]
for(const gear of equipmentOffersV0515)for(const grade of [1,2,3]){
  const rel='assets/equipment/v05151/'+gear.id+'_g'+grade+'.png'
  const file=join(root,'public',rel)
  writePng(file,paintGear(gear,grade))
  manifest.push({assetId:gear.assetId.replace(/\.g1$/,'.g'+grade),path:'/'+rel,
    grade,slot:gear.slot,tier:gear.tier,channel:gear.channel,width:SIZE,height:SIZE})
  produced++
}
for(const merchant of castleGearMerchantsV05151){
  writePng(join(npcDestination,merchant.npcId+'.png'),paintMerchant(merchant))
}
writeFileSync(join(destination,'manifest.json'),JSON.stringify({
  schemaVersion:'0.5.15.1',kind:'pixel-art-png',pixelSize:SIZE,
  equipmentCount:equipmentOffersV0515.length,grades:3,merchantCount:castleGearMerchantsV05151.length,
  entries:manifest,
},null,2))
if(produced!==4200||castleGearMerchantsV05151.length!==16)throw Error('Unexpected sprite count '+produced)
if(!existsSync(join(destination,equipmentOffersV0515[0].id+'_g1.png')))throw Error('First sprite not found')
console.log('Terrúnia v0.5.15.1: '+produced+' PNG sprites and 16 merchant portraits generated.')
