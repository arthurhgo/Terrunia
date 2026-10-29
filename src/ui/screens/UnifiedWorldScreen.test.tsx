import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { UnifiedWorldScreen } from './UnifiedWorldScreen'

function LocationProbe() {
  const location = useLocation()
  return <output aria-label="Rota atual">{location.pathname}</output>
}

const seedExpedition = () => {
  const draft = createNewSave('unified-owner', 'Nira', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(draft, content, undefined, 'unified-weapon')
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.eventLog.push('CutsceneViewed:terran_arrival', 'CutsceneViewed:astravel_call')
  save.world.currentLocationId = 'astravel_fungorro_01'
  save.world.trailNodeStates.astravel_entry = 'completed'
  save.world.trailNodeStates.astravel_fungorro_01 = 'current'
  save.quests.vs_astravel_first_contact.status = 'active'
  useGameStore.setState({ status: 'ready', ownerId: save.ownerId, syncStatus: 'saved', syncMode: 'local', save })
}

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('viewport unificada', () => {
  it('troca exploração por combate sem trocar a rota nem desmontar o shell', () => {
    seedExpedition()
    render(<MemoryRouter initialEntries={['/play']}><UnifiedWorldScreen /><LocationProbe /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Astravél' })).toBeInTheDocument()
    expect(screen.getByLabelText('Rota atual')).toHaveTextContent('/play')
    const journey = screen.getByRole('navigation', { name: 'Caminho da base até o personagem' })
    expect(within(journey).getByText('Terran')).toBeInTheDocument()
    expect(within(journey).getByText('Portal')).toBeInTheDocument()
    expect(within(journey).getByText('Astravél')).toBeInTheDocument()

    act(() => useGameStore.getState().startBattle('astravel_fungorro_01'))

    expect(screen.getByRole('heading', { name: 'Primeira Presença Fungorra' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Viewport unificada de combate' })).toBeInTheDocument()
    expect(screen.getByLabelText('Rota atual')).toHaveTextContent('/play')
    expect(within(journey).getByText('Batalha').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_fungorro_01')
  })
})
