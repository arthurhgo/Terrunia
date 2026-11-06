import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { PortalHubScreen } from './PortalHubScreen'

const seed = () => {
  const initial = createNewSave('portal-buttons-ui', 'Lysa', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(initial, content)
  if (!bound.ok) throw Error(bound.message)
  const save = bound.value
  save.world.currentLocationId = 'location_terran_portal_plaza'
  save.world.trailNodeStates.astravel_entry = 'current'
  save.quests.vs_astravel_first_contact.status = 'active'
  useGameStore.setState({ ownerId: save.ownerId, save, status: 'ready', syncStatus: 'saved', syncMode: 'local' })
  return save
}
const view = () => render(<MemoryRouter initialEntries={['/portal-hub']}><Routes>
  <Route path="/portal-hub" element={<PortalHubScreen />} />
  <Route path="/play" element={<p>Exploração iniciada</p>} />
</Routes></MemoryRouter>)

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('Portal de Terran — escolhas diretas por botões', () => {
  it('abre no marco 0 sem iniciar combate e entra em Astravél com um clique consciente', () => {
    seed()
    view()
    expect(screen.getByText(/0 · ENTRADA/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Escolha seu destino' })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
    const button = screen.getByRole('button', { name: /Floresta de Astravél · Iniciar/ })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(screen.getByText('Exploração iniciada')).toBeInTheDocument()
  })

  it('exibe requisitos de Ondas e Caçadas ainda bloqueadas, sem modificar o save', () => {
    seed()
    const before = structuredClone(useGameStore.getState().save)
    view()
    const waves = screen.getByRole('button', { name: /Modo Ondas · Bloqueada/ })
    expect(waves).toBeDisabled()
    expect(screen.getByText('Conclua o primeiro combate de Astravél.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Rastro Micelial · Bloqueada/ })).toBeDisabled()
    fireEvent.click(waves)
    expect(useGameStore.getState().save).toEqual(before)
  })

  it('ativa o Modo Ondas diretamente quando o primeiro combate já terminou', () => {
    const save = seed()
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    useGameStore.setState({ save })
    view()
    const waves = screen.getByRole('button', { name: /Modo Ondas · Iniciar/ })
    expect(waves).toBeEnabled()
    fireEvent.click(waves)
    expect(useGameStore.getState().save?.battle?.waveIndex).toBe(1)
    expect(screen.getByText('Exploração iniciada')).toBeInTheDocument()
  })

  it('mantém os novos destinos bloqueados até a entrega dos capítulos principais', () => {
    const save = seed()
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    useGameStore.setState({ save })
    const { unmount } = view()
    expect(screen.getByRole('button', { name: /Rastro Micelial · Bloqueada/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Guardiões do Limiar · Bloqueada/ })).toBeDisabled()
    unmount()
    save.quests.main_astravel_lost_hunters.status = 'completed'
    save.character.level = 4
    useGameStore.setState({ save })
    view()
    expect(screen.getByRole('button', { name: /Rastro Micelial · Iniciar/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /Guardiões do Limiar · Bloqueada/ })).toBeDisabled()
  })
})
