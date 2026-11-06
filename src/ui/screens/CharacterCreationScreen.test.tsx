import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { CharacterCreationScreen } from './CharacterCreationScreen'

afterEach(() => { cleanup(); useGameStore.getState().resetSession(); vi.restoreAllMocks() })

describe('criação com pontos individuais', () => {
  it('investe um ponto por clique, d4+1 antes de d6, sem conceder build pronta', async () => {
    const createGame = vi.fn(async () => false)
    useGameStore.setState({ save: null, createGame })
    render(<MemoryRouter><CharacterCreationScreen /></MemoryRouter>)
    const plus = (name: string) => screen.getByRole('button', { name: 'Adicionar ponto de ' + name })
    const die = (name: string) => screen.getByLabelText('Dado de ' + name)
    const continueButton = screen.getByRole('button', { name: /Confirmar e continuar/ })
    fireEvent.change(screen.getByPlaceholderText('Ex.: Aron'), { target: { value: 'Aron' } })
    expect(continueButton).toBeDisabled()
    expect(die('Força')).toHaveTextContent('d4')
    fireEvent.click(plus('Força'))
    expect(die('Força')).toHaveTextContent('d4 + 1')
    fireEvent.click(plus('Força'))
    expect(die('Força')).toHaveTextContent('d6')
    for (const name of ['Astúcia', 'Agilidade', 'Vigor', 'Espírito']) fireEvent.click(plus(name))
    expect(continueButton).toBeEnabled()
    fireEvent.click(continueButton)
    await waitFor(() => expect(createGame).toHaveBeenCalledWith('Aron', 'character.terririan.default',
      expect.objectContaining({ presentation: expect.any(String) }),
      { cunning: 1, agility: 1, strength: 2, vigor: 1, spirit: 1 }))
  })

  it('recupera exatamente um ponto e bloqueia ultrapassar os seis pontos iniciais', () => {
    useGameStore.setState({ save: null })
    render(<MemoryRouter><CharacterCreationScreen /></MemoryRouter>)
    const strength = screen.getByRole('button', { name: 'Adicionar ponto de Força' })
    const subtract = screen.getByRole('button', { name: 'Retirar ponto de Força' })
    expect(subtract).toBeDisabled()
    fireEvent.click(strength)
    fireEvent.click(strength)
    fireEvent.click(subtract)
    expect(screen.getByLabelText('Dado de Força')).toHaveTextContent('d4 + 1')
    for (const name of ['Astúcia', 'Agilidade', 'Vigor', 'Espírito']) fireEvent.click(screen.getByRole('button', { name: 'Adicionar ponto de ' + name }))
    fireEvent.click(strength)
    expect(screen.getByText(/0 pontos restantes/)).toBeInTheDocument()
    expect(strength).toBeDisabled()
  })
})
