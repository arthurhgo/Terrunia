import type { ActorFacing } from '../terran/pixelActorArt'
import type { VisualItem } from './equipmentVisuals'
import { armorPixels, type ArmorPixel } from './armorSilhouette'

/** Replaceable 32px silhouettes for v0.5.15 until final artist sprites are provided.
 * The same pixel geometry is consumed by canvas and React compositions.
 */
export function equipmentPixels(item:VisualItem,facing:ActorFacing):ArmorPixel[]{
 if(item.slot==='armor')return armorPixels(facing)
 if(!item.palette)return []
 const left=facing==='left',back=facing==='up'
 const hand=left?5:25
 const rect=(x:number,y:number,w:number,h:number,tone:ArmorPixel['tone']):ArmorPixel=>({x,y,w,h,tone})
 switch(item.slot){
  case 'helmet': return [rect(10,8,13,4,'shade'),rect(10,9,13,3,'base'),
   rect(9,11,3,5,'shade'),rect(21,11,3,5,'shade'),rect(13,9,7,1,'light'),
   rect(15,12,3,2,'rune')]
  case 'pants':return [rect(11,25,11,2,'shade'),rect(12,26,4,5,'base'),
    rect(18,26,4,5,'base'),rect(12,27,1,3,'light'),rect(19,27,1,3,'light')]
  case 'boots':return [rect(10,30,6,2,'shade'),rect(18,30,6,2,'shade'),
    rect(11,29,4,2,'base'),rect(19,29,4,2,'base'),rect(11,30,3,1,'light')]
  case 'necklace':return [rect(14,17,5,1,'shade'),rect(15,18,3,3,'base'),rect(16,19,1,1,'rune')]
  case 'bracelet':return [rect(hand-2,23,5,4,'shade'),rect(hand-1,24,3,2,'base'),rect(hand,24,1,1,'rune')]
  case 'accessoryA':return [rect(7,20,4,5,'shade'),rect(8,21,3,3,'base'),rect(9,22,1,1,'rune')]
  case 'accessoryB':return [rect(22,20,4,5,'shade'),rect(23,21,3,3,'base'),rect(24,22,1,1,'rune')]
  case 'shield':return [rect(left?23:3,19,6,9,'shade'),rect(left?24:4,20,4,7,'base'),rect(left?25:5,22,2,3,'rune')]
  case 'weapon':return back?[rect(23,12,2,17,'shade'),rect(23,12,2,11,'base'),rect(22,12,4,3,'light')]:
   [rect(hand+1,10,2,15,'shade'),rect(hand+1,12,2,11,'base'),rect(hand,20,5,2,'light'),rect(hand+1,10,2,2,'rune')]
 }
}
