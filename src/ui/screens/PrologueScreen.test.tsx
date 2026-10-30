import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { PrologueScreen } from './PrologueScreen'

afterEach(() => {
  cleanup()
  useGameStore.getState().resetSession()
})

describe('Layout da escolha da Arma Vinculada', () => {
  it('mantém atributos à esquerda e arsenal à direita; libera sinergias apenas após seleção', () => {
    const save = createNewSave('ui-owner', 'Lysa', 'character.terririan.default', content)
    useGameStore.setState({
      save, ownerId: save.ownerId, status: 'ready',
      syncStatus: 'saved', syncMode: 'local',
    })
    render(<MemoryRouter><PrologueScreen /></MemoryRouter>)

    const introduction = screen.getByRole('heading', { name: 'O primeiro Vínculo' }).closest('.prologue-copy')
    const bindingPanel = screen.getByRole('heading', { name: 'Escolha da Arma Vinculada' }).closest('.arcane-panel')
    expect(introduction).toBeInTheDocument()
    expect(within(introduction as HTMLElement).queryByText(/Seu Vínculo é permanente/)).not.toBeInTheDocument()
    expect(within(introduction as HTMLElement).queryByText(/Drops fortalecem a arma/)).not.toBeInTheDocument()
    expect(bindingPanel).toBeInTheDocument()
    const attributes = within(introduction as HTMLElement).getByRole('region', { name: 'Distribuição de atributos' })
    expect(attributes).toHaveClass('attribute-allocator--vertical')
    expect(attributes).toHaveTextContent('LIMITES DO TERRÍRIAN')
    expect(attributes).toHaveTextContent('Distribuição de atributos')
    const rows = attributes.querySelectorAll('.attribute-allocator__grid > article')
    expect(rows).toHaveLength(5)
    expect(Array.from(rows, (row) => row.querySelector('strong')?.textContent)).toEqual([
      'Astúcia', 'Agilidade', 'Força', 'Vigor', 'Espírito',
    ])
    expect(within(introduction as HTMLElement).queryByRole('region', { name: 'Galeria flutuante de armas vinculadas' })).not.toBeInTheDocument()
    expect(within(bindingPanel as HTMLElement).getByRole('region', { name: 'Galeria flutuante de armas vinculadas' })).toBeInTheDocument()
    expect(screen.queryByText(/Sinergias e caminhos de Clã/)).not.toBeInTheDocument()
    expect(within(bindingPanel as HTMLElement).getByRole('heading', { name: 'Sem arma vinculada' })).toBeInTheDocument()
    expect(within(bindingPanel as HTMLElement).getByRole('region', { name: 'Prévia do personagem com arma selecionada' })).toBeInTheDocument()
    const heroPreview = within(bindingPanel as HTMLElement).getByRole('region', { name: 'Prévia do personagem com arma selecionada' })
    expect(heroPreview.querySelector('.prologue-hero-preview__stage')).toHaveClass('is-unarmed')
    expect(within(heroPreview).queryByRole('img', { name: /equipada na mão do personagem/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Selecione uma arma' })).toBeDisabled()

    const axe = screen.getByRole('button', { name: 'Escolher Machado de Guerra' })
    fireEvent.mouseEnter(axe)
    expect(screen.getByText('Ruptura do Machado')).toBeInTheDocument()
    expect(screen.queryByText(/Sinergias e caminhos de Clã/)).not.toBeInTheDocument()

    fireEvent.click(axe)
    expect(within(bindingPanel as HTMLElement).queryByRole('heading', { name: 'Sem arma vinculada' })).not.toBeInTheDocument()
    expect(within(heroPreview).getByRole('img', { name: 'Machado de Guerra equipada na mão do personagem (prévia)' })).toHaveClass('prologue-hero-preview__equipped-weapon')
    expect(heroPreview.querySelector('.prologue-hero-preview__actor')).toHaveAttribute('data-weapon-id', 'bound_weapon_war_axe')
    expect(heroPreview.querySelector('.prologue-hero-preview__stage')).toHaveClass('is-armed')
    expect(within(heroPreview).getByRole('img', { name: 'Terrírian Lysa' })).toHaveClass('prologue-hero-preview__character')
    expect(screen.getByRole('region', { name: 'Sinergias de Clã para Machado de Guerra' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sinergias e caminhos de Clã' })).toBeInTheDocument()
    expect(screen.getByText('+4 Vida')).toBeInTheDocument()
    expect(within(bindingPanel as HTMLElement).getByText('FUNDAÇÃO SELECIONADA')).toBeInTheDocument()
  })
})
