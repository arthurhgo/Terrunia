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

})
