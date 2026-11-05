import { useState } from 'react'
import type { BattleState } from '../../domain/combat/types'

/** Uses battle initiative and persisted log: never invents actions or turn numbers. */
export function BattleTimeline({ battle }: { battle: BattleState }) {
  const [expanded, setExpanded] = useState(false)
  const history = battle.log.filter((entry) => entry.roll || entry.tone === 'damage' || entry.tone === 'reward'
    || entry.message.startsWith('Turno de '))
  const visible = history.slice(-7)
  return <section className="combat-timeline" aria-label="Linha do tempo do combate">
    <div className="combat-timeline__header">
      <strong>TURNO {battle.round}</strong>
      <small>{battle.phase === 'AwaitingInitiative' ? 'INICIATIVA PENDENTE' : 'ORDEM DE INICIATIVA'}</small>
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
        aria-controls="combat-timeline-history">{expanded ? 'Recolher histórico' : 'Ver histórico'}</button>
    </div>
    <ol className="combat-timeline__actors" aria-label="Ordem de turnos">
      {battle.initiativeOrder.map((id, index) => {
        const actor = battle.combatants[id]
        if (!actor) return null
        return <li key={id} className={`${actor.side === 'player' ? 'is-player' : 'is-enemy'} ${battle.actorId === id ? 'is-current' : ''} ${!actor.alive ? 'is-defeated' : ''}`}
          title={`${actor.name} · iniciativa ${actor.initiative}`} aria-label={`${index + 1}º: ${actor.name}, iniciativa ${actor.initiative}`}>
          <span className="combat-timeline__number">{index + 1}</span>
          <span className="combat-timeline__actor">{actor.side === 'player' ? '◆ ' : '◇ '}{actor.name}</span>
          <b>{battle.phase === 'AwaitingInitiative' ? '?' : actor.initiative}</b>
        </li>
      })}
    </ol>
    <ol className="combat-timeline__events" aria-label="Últimos eventos da batalha">
      {visible.length ? visible.map((entry) => {
        const actor = entry.roll ? battle.combatants[entry.roll.actorId] : null
        return <li key={entry.id} className={`${actor?.side === 'player' ? 'is-player' : actor?.side === 'enemy' ? 'is-enemy' : 'is-neutral'} ${entry.tone === 'damage' ? 'is-damage' : ''}`}
          title={entry.message}>
          <small>T{entry.round}</small>
          <span>{entry.roll ? `d${entry.roll.sides}: ${entry.roll.face} · ${entry.roll.action}` : entry.message}</span>
        </li>
      }) : <li className="is-neutral">A batalha aguarda sua primeira ação.</li>}
    </ol>
    {expanded && <div id="combat-timeline-history" className="combat-timeline__history">
      {battle.log.slice(-32).map((entry) =>
        <p key={entry.id}><b>T{entry.round}</b> {entry.message}</p>)}
    </div>}
  </section>
}
