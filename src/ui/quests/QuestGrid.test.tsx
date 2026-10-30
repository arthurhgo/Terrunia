import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { QuestGrid } from './QuestGrid'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('Registro visual de missões', () => {
  it('mostra cards em grid e revela objetivos, recompensas e NPC no hover e foco', () => {
    const save = createNewSave('quest-owner', 'Lysa', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.main_lithwynn_signs.status = 'active'
    useGameStore.setState({ status: 'ready', ownerId: save.ownerId, save })
    render(<MemoryRouter><QuestGrid save={save} /></MemoryRouter>)
    const first = content.quests.vs_astravel_first_contact
    const second = content.quests.main_lithwynn_signs
    expect(screen.getByRole('region', { name: 'Registro de missões em grid' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Detalhes da missão ${first.title}` })).toBeInTheDocument()
    const secondCard = screen.getByRole('button', { name: `Detalhes da missão ${second.title}` })
    fireEvent.mouseEnter(secondCard)
    expect(screen.getByRole('complementary', { name: `Detalhes: ${second.title}` })).toBeInTheDocument()
    expect(screen.getByText(second.summary, { selector: '.quest-board__details p' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Objetivos' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Recompensas' })).toBeInTheDocument()
    fireEvent.focus(screen.getByRole('button', { name: `Detalhes da missão ${first.title}` }))
    expect(screen.getByRole('complementary', { name: `Detalhes: ${first.title}` })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Secundária 0' }))
    expect(screen.getByText(/Nenhuma missão nesta categoria/)).toBeInTheDocument()
  })
})
