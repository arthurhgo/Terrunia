import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { QuestGrid } from './QuestGrid'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('Registro visual de missões', () => {
  it('mostra missões em linhas e abre objetivos e recompensas apenas por interação', () => {
    const save = createNewSave('quest-owner', 'Lysa', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.main_lithwynn_signs.status = 'active'
    useGameStore.setState({ status: 'ready', ownerId: save.ownerId, save })
    render(<MemoryRouter><QuestGrid save={save} /></MemoryRouter>)
    const first = content.quests.vs_astravel_first_contact
    const second = content.quests.main_lithwynn_signs
    expect(screen.getByRole('region', { name: 'Diário de missões' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Detalhes da missão ${first.title}` })).toBeInTheDocument()
    const secondCard = screen.getByRole('button', { name: `Detalhes da missão ${second.title}` })
    fireEvent.click(secondCard)
    expect(screen.getByRole('region', { name: `Detalhes: ${second.title}` })).toBeInTheDocument()
    expect(screen.getByText(second.summary, { selector: '.quest-board__details p' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recompensas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: `Detalhes da missão ${first.title}` }))
    expect(screen.getByRole('region', { name: `Detalhes: ${first.title}` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Secundárias 0' }))
    expect(screen.getByText(/Nenhuma missão nesta categoria/)).toBeInTheDocument()
  })

  it('prioriza a história em andamento, empilha secundárias e deixa concluídas no final', () => {
    const save = createNewSave('quest-owner', 'Lysa', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'active'
    save.quests.side_street_arlen.status = 'active'
    save.quests.delivery_neris_stock.status = 'active'
    const { container } = render(<MemoryRouter><QuestGrid save={save} compact /></MemoryRouter>)
    const groups = [...container.querySelectorAll('.quest-journal-group')]
    expect(groups.map((group) => group.getAttribute('aria-label'))).toEqual(['Missão principal', 'Secundárias', 'Concluídas'])
    expect(groups[0]).toHaveTextContent('Caçadores Perdidos')
    expect(groups[1].querySelectorAll('.quest-row')).toHaveLength(2)
    expect(groups[2]).toHaveTextContent('O Primeiro Rastro')
    expect(container.querySelector('.quest-board__details')).toBeNull()
    const first = screen.getByRole('button', { name: 'Detalhes da missão Caçadores Perdidos' })
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'false')
  })
})
