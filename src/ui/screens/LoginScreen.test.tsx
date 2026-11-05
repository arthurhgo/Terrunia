import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { content } from '../../content/catalog'
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { createNewSave } from '../../domain/game/createSave'
import { useAuthStore } from '../../state/authStore'
import { rememberCosmeticAvatar } from '../characters/deviceAvatar'
import { LoginScreen } from './LoginScreen'

afterEach(() => {
  cleanup()
  localStorage.clear()
  useAuthStore.setState({ status: 'signedOut', user: null, error: null })
})

describe('tela de login com avatar do dispositivo', () => {
  it('apresenta apenas o visual salvo, sem divulgar o nome nem a conta anterior', () => {
    useAuthStore.setState({ status: 'signedOut', user: null, error: null })
    const save = createNewSave('private-owner', 'SegredoNome', 'character.terririan.default', content,
      '2026-11-05T20:00:00Z', undefined, undefined, DEFAULT_CHARACTER_APPEARANCE)
    rememberCosmeticAvatar(save)
    render(<MemoryRouter><LoginScreen /></MemoryRouter>)
    expect(screen.getByLabelText('Prévia cosmética do último Terrírian usado neste dispositivo')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Terrírian em pixel art' })).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
    expect(screen.getByText('ÚLTIMO TERRÍRIAN DESTE DISPOSITIVO')).toBeInTheDocument()
    expect(screen.queryByText('SegredoNome')).not.toBeInTheDocument()
    expect(screen.queryByText('private-owner')).not.toBeInTheDocument()
  })

  it('mostra fallback quando ainda não há avatar criado no dispositivo', () => {
    useAuthStore.setState({ status: 'signedOut', user: null, error: null })
    render(<MemoryRouter><LoginScreen /></MemoryRouter>)
    expect(screen.getByText('SEU TERRÍRIAN AGUARDA')).toBeInTheDocument()
  })
})
