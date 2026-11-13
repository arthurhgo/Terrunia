import type {GameSave} from '../domain/game/types'
import type {GearOffer} from './equipmentV0515'
export type BuildRoleV05171='MAGIA'|'GUERREIRO'|'ARCO'|'DEFESA'|'HÍBRIDO'
const recommendations:Record<string,BuildRoleV05171>={
 sentinela_da_luz:'DEFESA',gladiador_da_barreira:'GUERREIRO',
 batedor_da_vigilia:'ARCO',forjador_arcano:'HÍBRIDO',
 guardiao_das_inscricoes:'MAGIA',gravador_das_sombras:'MAGIA',
 astrologo_celestial:'MAGIA',profeta_do_orbe:'MAGIA',
 cacador_de_constelacoes:'ARCO',canalizador_do_caos:'MAGIA',
 guardador_da_ruptura:'DEFESA',mago_da_ruina:'MAGIA',
}
export const recommendedBuildRoleV05171=(offer:GearOffer):BuildRoleV05171=>
 recommendations[offer.classId??offer.recommendedClassId??'']??'HÍBRIDO'
export const activeBuildRoleV05171=(save:GameSave):BuildRoleV05171=>{
 const linked=save.character.bondedEquipment.weapon
 const weapon=linked?save.boundItems[linked]:undefined
 const id=weapon?.baseItemId??''
 if(/bow/i.test(id))return 'ARCO'
 if(/scepter|staff|spellbook/i.test(id))return 'MAGIA'
 if(/shield/i.test(id))return 'DEFESA'
 if(/axe|sword|dagger|prologue/i.test(id))return 'GUERREIRO'
 return 'HÍBRIDO'
}
export const assessGearRecommendationV05171=(save:GameSave,offer:GearOffer)=>{
 const recommended=recommendedBuildRoleV05171(offer)
 const current=activeBuildRoleV05171(save)
 const match=recommended===current||recommended==='HÍBRIDO'||current==='HÍBRIDO'
 return {recommended,current,match,reason:match?'Combina com a arma atual':'Uso situacional para outra configuração'}
}
