import type { Combatant } from './types'

/** UI-only, VISUAL_DRAFT: compare existing combat stats without setting a difficulty tier
 * or creating a new damage rule. These messages never change turn order or outcome. */
export function getEnemyReadouts(enemy: Combatant, hero: Combatant, protectedBoss = false): string[] {
  const cues: string[] = []
  if (protectedBoss) cues.push('PROTEGIDO')
  if (enemy.attackPower > hero.attackPower) cues.push('ATAQUE ELEVADO')
  if (enemy.mitigation >= hero.attackPower) cues.push('DEFESA RESISTENTE')
  if (enemy.statusEffects.length > 0) cues.push('EFEITO ATIVO')
  if (hero.hp > 0 && hero.hp <= Math.ceil(hero.maxHp / 4)) cues.push('SUA VIDA CRÍTICA')
  return cues
}

/** A resolved die is already authoritative. Feedback never predicts a roll. */
export function getImpactReadout(damage: number, critical: boolean): 'CRÍTICO!' | 'SEM DANO' | 'ACERTO' {
  return critical && damage > 0 ? 'CRÍTICO!' : damage <= 0 ? 'SEM DANO' : 'ACERTO'
}

/** Visual feedback comes exclusively from an authoritative resolved hit. */
export function getLayerImpactV0517(damage:number,critical:boolean,layers?:{shield?:number;armor?:number;arcane?:number}) {
 if(damage>0)return critical?'CRÍTICO!':'ACERTO'
 if((layers?.shield??0)>0)return 'ESCUDO'
 if((layers?.arcane??0)>0)return 'ABSORVIDO'
 if((layers?.armor??0)>0)return 'ARMADURA'
 return 'SEM DANO'
}
