import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { TerranQuickJournal } from './TerranQuickJournal'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

const fresh = () => createNewSave('journal-test', 'Terrírian', 'character.terririan.default', content)

describe('diário compacto v0.5.1', () => {
  it('mostra Rosetta primeiro, sem listar ofertas ainda não aceitas', () => {
    const save = fresh()
    render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    const journal = screen.getByRole('region', { name: 'Missões fixas' })
    expect(within(journal).getByText('01 · Falar com Rosetta')).toBeInTheDocument()
    expect(within(journal).queryByText('O Primeiro Rastro')).not.toBeInTheDocument()
    expect(within(journal).getAllByText('Nenhuma missão nesta etapa')).toHaveLength(3)
    expect(journal.querySelectorAll('.terran-quick-journal__line--empty')).toHaveLength(4)
  })

  it('mostra missões aceitas em linhas, entrega em verde e concluídas recolhidas', () => {
    const save = fresh()
    save.quests.rosetta_tutorial_equip.status = 'active'
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    save.quests.main_terran_first_home.status = 'completed'
    useGameStore.setState({ save, status: 'ready', ownerId: save.ownerId })
    const { container } = render(<MemoryRouter><TerranQuickJournal save={save} /></MemoryRouter>)
    expect(screen.queryByText('01 · Falar com Rosetta')).not.toBeInTheDocument()
    expect(screen.getByText('Uma Primeira Proteção')).toBeInTheDocument()
    expect(screen.getByText('O Primeiro Rastro')).toBeInTheDocument()
    expect(container.querySelectorAll('.terran-quick-journal__line--ready_to_turn_in')).toHaveLength(1)
    const history = screen.getByText('Concluídas', { selector: 'summary' })
    expect(history.closest('details')).not.toHaveAttribute('open')
    fireEvent.click(history)
    expect(history.closest('details')).toHaveAttribute('open')
  })
})
