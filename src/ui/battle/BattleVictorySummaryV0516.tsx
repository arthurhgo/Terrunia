import type { GameSave } from '../../domain/game/types'
/** After claim only; no earlier reward disclosure during dice focus. */
export function BattleVictorySummaryV0516({save}:{save:GameSave}){
 const battle=save.battle;if(!battle||!battle.claimed||battle.phase!=='Victory')return null
 const r=battle.rewards
 return <section className="battle-victory-summary-v0516" aria-label="Balanço da vitória">
  <strong>ESPÓLIOS RECOLHIDOS</strong>
  <dl><div><dt>XP</dt><dd>+{r.characterXp}</dd></div><div><dt>Ouro</dt><dd>+{r.gold}</dd></div>
   <div><dt>Ressonância</dt><dd>+{r.boundResonance}</dd></div><div><dt>Itens</dt><dd>{r.lootDefinitionIds.length}</dd></div></dl>
  {r.fieldRecovery && <small>Recuperação disponível: até {r.fieldRecovery.hp} PV e {r.fieldRecovery.mp} PM, limitada pelos máximos. Vida atual {save.vitals.hp}; Mana atual {save.vitals.mp}.</small>}
  <small>Recompensas de missões ainda precisam de entrega ao NPC.</small>
 </section>
}
