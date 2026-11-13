import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { createNewSave } from '../../domain/game/createSave'
import { createBattle } from '../../domain/combat/engine'
import { content } from '../../content/catalog'
import { BattleTimeline } from './BattleTimeline'

describe('timeline visual minimalista', () => {
  it('mostra somente retratos e valores reais de iniciativa, sem histórico textual', () => {
    const save = createNewSave('owner','Ter','character.terririan.default',content)
    const battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'test-timeline')
    const appearance = { ...DEFAULT_CHARACTER_APPEARANCE, hairColor: '#441122' }
    const { container } = render(<BattleTimeline battle={battle} playerAppearance={appearance}
      playerPortraitAssetId={save.character.portraitAssetId} />)
    const nav = screen.getByRole('navigation', { name: 'Linha do tempo do combate' })
    const order = screen.getByLabelText('Ordem de turnos')
    expect(order.querySelectorAll('li')).toHaveLength(battle.initiativeOrder.length)
    expect(nav).not.toHaveTextContent('Turno de')
    expect(container.querySelector('.combat-timeline__events')).not.toBeInTheDocument()
    expect(container.querySelector('.combat-timeline__header')).not.toBeInTheDocument()
    const first = order.querySelector('li')
    expect(first).toHaveAttribute('title', expect.stringContaining('Iniciativa'))
    const portrait = container.querySelector('.combat-timeline__portrait.is-player img')
    expect(portrait?.getAttribute('src')).toContain('data:image/svg+xml')
    expect(order.textContent).toContain(String(battle.combatants.combatant_player.initiative))
  })

  it('mantém resultado oculto até a rolagem efetiva', () => {
    const save = createNewSave('owner','Ter','character.terririan.default',content)
    const battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'pending-init',
      { manualInitiative: true })
    const { container } = render(<BattleTimeline battle={battle} />)
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(0)
    expect(screen.getByLabelText('Ordem de turnos').querySelectorAll('li')).toHaveLength(battle.initiativeOrder.length)
  })
  it('revela iniciativas individualmente sem vazar as demais nos atributos acessíveis', () => {
    const save = createNewSave('owner','Ter','character.terririan.default',content)
    const battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'pending-reveal',
      { manualInitiative: true })
    const enemy = Object.values(battle.combatants).find((actor) => actor.side === 'enemy')!
    const { rerender, container } = render(<BattleTimeline battle={battle} revealedInitiative={{}} />)
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(0)
    rerender(<BattleTimeline battle={battle} revealedInitiative={{ [enemy.id]: 9 }} />)
    expect(container.querySelectorAll('.combat-timeline__initiative')).toHaveLength(1)
    const enemyNode = screen.getByTitle(new RegExp(enemy.name + '.*Iniciativa 9'))
    expect(enemyNode.getAttribute('aria-label')).toContain('iniciativa 9')
    expect([...container.querySelectorAll('.combat-timeline__portrait')].filter((node) =>
      node.getAttribute('title')?.includes('Aguardando iniciativa')).length).toBe(
        battle.initiativeOrder.length - 1,
      )
  })

  it('exibe próxima iniciativa alterada por status sem divulgar dados pendentes',()=>{
    const save=createNewSave('timeline-v0517','Terrírian','character.terririan.default',content)
    const battle=createBattle(save,content.encounters.encounter_fungorro_01,content,'timeline-v0517',{manualInitiative:true})
    const player=battle.combatants.combatant_player
    const enemy=Object.values(battle.combatants).find(c=>c.side==='enemy')!
    battle.phase='AwaitingAction';battle.actorId=player.id;battle.actorCursor=0
    battle.initiativeOrder=[player.id,enemy.id]
    player.initiative=10;player.initiativeRolledBase=10
    enemy.initiative=9;enemy.initiativeRolledBase=9
    enemy.statusEffects.push({definitionId:'status_haste_v0517',sourceId:enemy.id,remainingTurns:2})
    const snapshot=structuredClone(battle)
    const view=render(<BattleTimeline battle={battle}/>)
    const next=screen.getByRole('note',{name:'Previsão da próxima ordem por status'})
    expect(next).toHaveTextContent('PRÓXIMA RODADA')
    expect(next).toHaveTextContent('1º '+enemy.name)
    expect(battle).toEqual(snapshot)
    battle.phase='AwaitingInitiative'
    view.rerender(<BattleTimeline battle={battle}/>)
    expect(screen.queryByRole('note',{name:'Previsão da próxima ordem por status'})).not.toBeInTheDocument()
  })

})
