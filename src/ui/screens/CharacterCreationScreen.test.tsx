import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { useGameStore } from '../../state/gameStore'
import { CharacterCreationScreen } from './CharacterCreationScreen'

afterEach(() => { cleanup(); useGameStore.getState().resetSession(); vi.restoreAllMocks() })

describe('criação: a distribuição pertence ao primeiro Vínculo', () => {
  it('permite criar o Terrírian sem atribuir pontos', async () => {
    const createGame = vi.fn(async () => false)
    useGameStore.setState({ save: null, createGame })
    render(<MemoryRouter><CharacterCreationScreen /></MemoryRouter>)
    const submit = screen.getByRole('button', { name: /Confirmar e continuar/ })
    expect(submit).toBeDisabled()
    expect(screen.queryByRole('button', { name: /Adicionar ponto/ })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Distribuir atributos na criação')).not.toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Ex.: Aron'), { target: { value: 'Aron' } })
    expect(submit).toBeEnabled()
    fireEvent.click(submit)
    await waitFor(() => expect(createGame).toHaveBeenCalledWith('Aron', 'character.terririan.default',
      expect.objectContaining({ presentation: expect.any(String) })))
    expect(createGame.mock.calls[0]).toHaveLength(3)
  })

  it('preserva personalização de aparência sem criar build inicial', async () => {
    const createGame = vi.fn(async () => false)
    useGameStore.setState({ save: null, createGame })
    render(<MemoryRouter><CharacterCreationScreen /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText('Ex.: Aron'), { target: { value: 'Lysa' } })
    fireEvent.click(screen.getByRole('button', { name: 'Costas' }))
    expect(screen.getByRole('button', { name: 'Costas' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: /Confirmar e continuar/ }))
    await waitFor(() => expect(createGame).toHaveBeenCalledOnce())
    expect(createGame.mock.calls[0][0]).toBe('Lysa')
  })
})
