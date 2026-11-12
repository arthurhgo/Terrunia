import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
/** Context-only text. Never accepts quests, assigns equipment or joins Clans. */
export function getRosettaContextTipV0516(save:GameSave,catalog:ContentCatalog):{title:string;message:string;destination:'inventory'|'paths'}|null{
 if(save.quests.rosetta_tutorial_supply?.status==='active'&&!save.character.basicArmorInstanceId)
  return {title:'Equipar sua proteção',message:'Equipe a peça Tier I recebida na Mochila; não precisa comprar outra.',destination:'inventory'}
 if(save.quests.rosetta_tutorial_refine?.status==='active')
  return {title:'Aprimorar sem trocar',message:'Aprimore a proteção simples com os materiais da missão na Casa do Ferreiro.',destination:'paths'}
 if(save.world.trailNodeStates.astravel_camp_03==='completed'&&!save.character.clan.clanId)
  return {title:'Preparação de Clã',message:save.character.level>=4?'A entrada nas Câmaras exige filiação por NPCs e ritos no Salão dos Clãs.':'A entrada nas Câmaras exige Clã; Rosetta orienta a partir do nível 4.',destination:'paths'}
 const p=Object.values(save.quests).find(q=>['active','ready_to_turn_in'].includes(q.status)&&catalog.quests[q.questId]?.turnInItems?.length)
 return p?{title:'Guarde materiais de missão',message:'Verifique a marca M da Mochila antes de vender materiais de “'+catalog.quests[p.questId].title+'”.',destination:'inventory'}:null
}
