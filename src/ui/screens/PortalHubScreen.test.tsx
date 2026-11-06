import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { PortalHubScreen } from './PortalHubScreen'

const seed = () => {
  const initial = createNewSave('portal-map-ui', 'Lysa', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(initial, content)
  if (!bound.ok) throw Error(bound.message)
  const save = bound.value
  save.world.currentLocationId = 'location_terran_portal_plaza'
  save.world.trailNodeStates.astravel_entry = 'current'
  save.quests.vs_astravel_first_contact.status = 'active'
  useGameStore.setState({ ownerId: save.ownerId, save, status: 'ready', syncStatus: 'saved', syncMode: 'local' })
}
const view = () => render(<MemoryRouter initialEntries={['/portal-hub']}><Routes>
  <Route path="/portal-hub" element={<PortalHubScreen />} />
  <Route path="/play" element={<p>Exploração iniciada</p>} />
</Routes></MemoryRouter>)

afterEach(() => { cleanup(); vi.useRealTimers(); useGameStore.getState().resetSession() })

describe('Mapa de instâncias — 0 Entrada', () => {
  it('inicia caminhando no marco 0, não luta, e só entra em Astravél após interação', () => {
    vi.useFakeTimers()
    seed()
    view()
    expect(screen.getByText('0 · ENTRADA')).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
    const gate = screen.getByRole('button', { name: /Floresta de Astravél · instância disponível/ })
    fireEvent.click(gate)
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('location_terran_portal_plaza')
    expect(useGameStore.getState().save?.battle).toBeNull()
    act(() => { vi.advanceTimersByTime(1650) })
    fireEvent.click(screen.getByRole('button', { name: 'ENTRAR NA INSTÂNCIA' }))
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(screen.getByText('Exploração iniciada')).toBeInTheDocument()
  })

  it('Modo Ondas bloqueado não inicia combate nem altera o save', () => {
    seed()
    view()
    fireEvent.click(screen.getByRole('button', { name: /Modo Ondas · bloqueada/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Bloqueado')
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('location_terran_portal_plaza')
  })
})
