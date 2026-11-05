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
export function BattleTimeline({ battle, playerAppearance, playerPortraitAssetId }: {
  battle: BattleState
  playerAppearance?: CharacterAppearance
  playerPortraitAssetId?: string
}) {
  const rolled = battle.phase !== 'AwaitingInitiative'
  return <nav className="combat-timeline combat-timeline--portraits" aria-label="Linha do tempo do combate">
    <ol className="combat-timeline__actors" aria-label="Ordem de turnos">
      {battle.initiativeOrder.map((id, index) => {
        const actor = battle.combatants[id]
        if (!actor) return null
        const active = rolled && actor.alive && battle.actorId === id
        const acted = rolled && index < battle.actorCursor
        const enemyAsset = content.enemies[actor.definitionId]?.assetId ?? 'enemy.fungorro-crawler'
        return <li key={id} className={[
          'combat-timeline__portrait', actor.side === 'player' ? 'is-player' : 'is-enemy',
          active ? 'is-current' : '', acted ? 'is-acted' : '', !actor.alive ? 'is-defeated' : '',
        ].filter(Boolean).join(' ')}
          title={`${actor.name} · ${rolled ? 'Iniciativa ' + actor.initiative : 'Aguardando iniciativa'}`}
          aria-label={`${index + 1}º: ${actor.name}, ${rolled ? 'iniciativa ' + actor.initiative : 'iniciativa pendente'}`}>
          <span className="combat-timeline__face" aria-hidden="true">
            {actor.side === 'player'
              ? <CharacterPortrait appearance={playerAppearance} portraitAssetId={playerPortraitAssetId} alt="" />
              : <AssetImage assetId={enemyAsset} alt="" />}
          </span>
          {rolled && <span className="combat-timeline__initiative" aria-hidden="true">{actor.initiative}</span>}
        </li>
      })}
    </ol>
  </nav>
}
