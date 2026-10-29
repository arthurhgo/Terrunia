import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useAuthStore } from '../../state/authStore'
import { useGameStore } from '../../state/gameStore'
import { CharacterAccessScreen } from './CharacterAccessScreen'

const originalResetCampaign = useGameStore.getState().resetCampaign

const seed = () => {
  const save = createNewSave(
    'screen-owner',
    'Nira',
    'character.terririan.default',
    content,
    '2026-10-29T10:00:00.000Z',
    { saveId: 'screen-save', characterId: 'screen-character' },
  )
  useAuthStore.setState({
    status: 'signedIn',
    user: { uid: save.ownerId, displayName: 'Arthur', email: 'arthur@example.com', photoURL: null, isGuest: false },
    error: null,
  })
  useGameStore.setState({
    status: 'ready', ownerId: save.ownerId, save, characterAccess: 'required', syncStatus: 'saved', syncMode: 'cloud',
  })
  return save
}

const renderAccess = () => render(
  <MemoryRouter initialEntries={['/character/access']}>
    <Routes>
      <Route path="/character/access" element={<CharacterAccessScreen />} />
      <Route path="/character/create" element={<output>Criação liberada</output>} />
      <Route path="/" element={<output>Campanha liberada</output>} />
    </Routes>
  </MemoryRouter>,
)

afterEach(() => {
  cleanup()
  useGameStore.setState({ resetCampaign: originalResetCampaign })
  useGameStore.getState().resetSession()
  useAuthStore.setState({ status: 'signedOut', user: null, error: null })
})

describe('seleção do personagem ao acessar a conta', () => {
  it('apresenta o Terrírian salvo e continua a campanha existente', async () => {
    const save = seed()
    renderAccess()

    expect(screen.getByRole('heading', { name: save.character.name })).toBeInTheDocument()
    expect(screen.getByText('arthur@example.com')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: `Continuar com ${save.character.name}` }))

    expect(await screen.findByText('Campanha liberada')).toBeInTheDocument()
    expect(useGameStore.getState().characterAccess).toBe('granted')
  })

  it('exige duas confirmações antes de liberar outro personagem', async () => {
    const save = seed()
    const resetCampaign = vi.fn(async () => {
      act(() => useGameStore.setState({ save: null, characterAccess: 'creating' }))
      return true
    })
    useGameStore.setState({ resetCampaign })
    renderAccess()

    await userEvent.click(screen.getByRole('button', { name: 'Criar outro Terrírian' }))
    expect(screen.getByRole('heading', { name: 'Criar outro Terrírian?' })).toBeInTheDocument()
    expect(resetCampaign).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.type(screen.getByRole('textbox'), 'RESETAR')
    await userEvent.click(screen.getByRole('button', { name: 'Criar outro personagem' }))

    expect(resetCampaign).toHaveBeenCalledOnce()
    expect(await screen.findByText('Criação liberada')).toBeInTheDocument()
    expect(save.ownerId).toBe('screen-owner')
  })
})
