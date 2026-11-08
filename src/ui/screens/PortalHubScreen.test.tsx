import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { PortalHubScreen } from './PortalHubScreen'
import { PortalPanel } from '../dashboard/PortalPanel'

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
const view = () => render(<MemoryRouter><PortalPanel save={useGameStore.getState().save!}
  onGoToEldamar={() => undefined} navigateOnEnter={false} /></MemoryRouter>)

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('Portal de Terran — escolhas diretas por botões', () => {
  it('abre no marco 0 sem iniciar combate e entra em Astravél com um clique consciente', () => {
    seed()
    view()
    expect(screen.getByRole('region', { name: 'Atividades da Praça do Portal' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Jornadas e desafios' })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
    const button = screen.getByRole('button', { name: /Floresta de Astravél · Iniciar/ })
    expect(button).toBeEnabled()
    fireEvent.click(button)
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(screen.getByRole('region', { name: 'Atividades da Praça do Portal' })).toBeInTheDocument()
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
    expect(screen.getByRole('region', { name: 'Atividades da Praça do Portal' })).toBeInTheDocument()
  })

  it('abre Cerrado e Elduran por confirmação explícita, com saves separados por ID', () => {
    const save = seed()
    const view1 = view()
    expect(screen.getByRole('button', { name: /Cerrado Místico · Bloqueada/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Deserto de Elduran · Bloqueada/ })).toBeDisabled()
    view1.unmount()
    save.world.trailNodeStates.astravel_boss_preview = 'completed'
    useGameStore.setState({ save })
    const view2 = view()
    fireEvent.click(screen.getByRole('button', { name: /Cerrado Místico · Iniciar/ }))
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('cerrado_entry')
    expect(useGameStore.getState().save?.battle).toBeNull()
    view2.unmount()
    const resumed = structuredClone(useGameStore.getState().save!)
    resumed.world.currentLocationId = 'location_terran_portal_plaza'
    resumed.world.trailNodeStates.cerrado_storm_04 = 'completed'
    useGameStore.setState({ save: resumed })
    view()
    fireEvent.click(screen.getByRole('button', { name: /Deserto de Elduran · Iniciar/ }))
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('elduran_entry')
    expect(useGameStore.getState().save?.battle).toBeNull()
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

describe('rota legada do Portal', () => {
  it('redireciona sem exibir menu intermediário nem iniciar combate', () => {
    seed()
    render(<MemoryRouter initialEntries={['/portal-hub']}><Routes>
      <Route path="/portal-hub" element={<PortalHubScreen />} />
      <Route path="/play" element={<p>Praça do Portal</p>} />
    </Routes></MemoryRouter>)
    expect(screen.getByText('Praça do Portal')).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
  })
})
