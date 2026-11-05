import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createNewSave } from '../../domain/game/createSave'
import { createBattle } from '../../domain/combat/engine'
import { content } from '../../content/catalog'
import { BattleTimeline } from './BattleTimeline'

describe('timeline de combate', () => {
  it('usa rodadas e iniciativa reais e revela histórico sem avançar o motor', () => {
    const save = createNewSave('owner','Ter','character.terririan.default',content)
    const battle = createBattle(save, content.encounters.encounter_fungorro_01, content, 'test-timeline')
    battle.round = 2
    battle.log.push({ id: 'test-log', round: 2, tone: 'damage',
      message: 'Ter causa 3 de dano em Fungorro.', roll: { actorId: 'combatant_player', sides: 4, face: 2, action: 'Ataque básico' } })
    render(<BattleTimeline battle={battle} />)
    expect(screen.getByRole('region', { name: 'Linha do tempo do combate' })).toHaveTextContent('TURNO 2')
    expect(screen.getByLabelText('Ordem de turnos')).toHaveTextContent(String(battle.combatants.combatant_player.initiative))
    expect(screen.getByLabelText('Últimos eventos da batalha')).toHaveTextContent('d4: 2')
    fireEvent.click(screen.getByRole('button', { name: 'Ver histórico' }))
    expect(screen.getByText(/Ter causa 3 de dano/)).toBeInTheDocument()
    expect(battle.round).toBe(2)
  })
})
