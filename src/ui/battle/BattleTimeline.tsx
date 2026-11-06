import { content } from '../../content/catalog'
import type { CharacterAppearance } from '../../domain/character/appearance'
import type { BattleState } from '../../domain/combat/types'
import { CharacterPortrait } from '../characters/CharacterSprite'
import { AssetImage } from '../components/AssetImage'

/**
 * Silent visual initiative rail: ONLY faces and the rolled initiative value.
 * Accessible names and title tooltips preserve exact numeric results and order.
 * Actor cursor, alive state and initiative are read from the battle engine.
 */
export function BattleTimeline({ battle, playerAppearance, playerPortraitAssetId, activeActorId, stagedHp }: {
  battle: BattleState
  playerAppearance?: CharacterAppearance
  playerPortraitAssetId?: string
  activeActorId?: string
  stagedHp?: Record<string, number> | null
}) {
  const rolled = battle.phase !== 'AwaitingInitiative'
  const currentId = activeActorId ?? battle.actorId
  const activeIndex = battle.initiativeOrder.indexOf(currentId)
  return <nav className="combat-timeline combat-timeline--portraits" aria-label="Linha do tempo do combate">
    <ol className="combat-timeline__actors" aria-label="Ordem de turnos">
      {battle.initiativeOrder.map((id, index) => {
        const actor = battle.combatants[id]
        if (!actor) return null
        const alive = (stagedHp?.[id] ?? actor.hp) > 0
        const active = rolled && alive && currentId === id
        const acted = rolled && index < (activeActorId ? activeIndex : battle.actorCursor)
        const enemyAsset = content.enemies[actor.definitionId]?.assetId ?? 'enemy.fungorro-crawler'
        return <li key={id} className={[
          'combat-timeline__portrait', actor.side === 'player' ? 'is-player' : 'is-enemy',
          active ? 'is-current' : '', acted ? 'is-acted' : '', !alive ? 'is-defeated' : '',
        ].filter(Boolean).join(' ')}
          title={`${actor.name} · ${rolled ? 'Iniciativa ' + actor.initiative : 'Aguardando iniciativa'}`}
          aria-current={active ? 'step' : undefined}
          aria-label={`${index + 1}º: ${actor.name}, ${rolled ? 'iniciativa ' + actor.initiative : 'iniciativa pendente'}${active ? ', AGORA É A VEZ' : ''}`}>
          {active && <span className="combat-timeline__turn-arrow" aria-hidden="true">▼</span>}
          <span className="combat-timeline__face" aria-hidden="true">
            {actor.side === 'player'
              ? <CharacterPortrait appearance={playerAppearance} portraitAssetId={playerPortraitAssetId} alt="" />
              : <AssetImage assetId={enemyAsset} alt="" />}
          </span>
          {active && <span className="combat-timeline__turn-label">VEZ</span>}
          {rolled && <span className="combat-timeline__initiative" aria-hidden="true">{actor.initiative}</span>}
        </li>
      })}
    </ol>
  </nav>
}
