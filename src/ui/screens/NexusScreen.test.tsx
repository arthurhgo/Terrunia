import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { NexusScreen } from './NexusScreen'

afterEach(() => {
  cleanup()
  useGameStore.getState().resetSession()
})

describe('Menu unificado do personagem', () => {
  it('mostra um único destino e organiza status, itens, mochila e histórico sem duplicação', () => {
    const save = createNewSave('hub-owner', 'Thaur', 'character.terririan.default', content)
    useGameStore.setState({ save, status: 'ready', ownerId: save.ownerId, syncMode: 'local', syncStatus: 'saved' })
    render(<MemoryRouter initialEntries={['/nexus']}><NexusScreen /></MemoryRouter>)

    const navigation = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(navigation).getAllByRole('link', { name: 'Personagem' })).toHaveLength(1)
    expect(within(navigation).queryByRole('link', { name: 'Nexo' })).not.toBeInTheDocument()
    expect(within(navigation).queryByRole('link', { name: 'Inventário' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { name: 'Status do personagem' })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { name: 'Itens equipados' })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { name: 'Mochila' })).toHaveLength(1)
    expect(screen.queryByText('NO QUE ESTOU ME TORNANDO')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Identidade' })).not.toBeInTheDocument()

    const history = screen.getByText('Histórico e memórias').closest('details')
    expect(history).not.toHaveAttribute('open')
    fireEvent.click(within(history!).getByText('Histórico e memórias'))
    expect(history).toHaveAttribute('open')
    expect(within(history!).getByRole('heading', { name: 'Crônica' })).toBeInTheDocument()
  })

  it('mostra proteção vestida em Itens sem duplicar no inventário da mesma tela', () => {
    const save = createNewSave('hub-owner', 'Thaur', 'character.terririan.default', content)
    save.equippedBasicArmor = {
      instanceId: 'worn-tunic', definitionId: 'equipment_worn_linen_tunic',
      quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt,
    }
    save.character.basicArmorInstanceId = 'worn-tunic'
    useGameStore.setState({ save, status: 'ready', ownerId: save.ownerId, syncMode: 'local', syncStatus: 'saved' })
    const { container } = render(<MemoryRouter><NexusScreen /></MemoryRouter>)
    expect(container.querySelector('.bound-card--starter')).toHaveTextContent('Túnica de Linho Gasta')
    expect(container.querySelector('.inventory-grid')).not.toHaveTextContent('Túnica de Linho Gasta')
    expect(screen.getByRole('button', { name: 'Retirar Túnica de Linho Gasta' })).toBeEnabled()
  })
})
