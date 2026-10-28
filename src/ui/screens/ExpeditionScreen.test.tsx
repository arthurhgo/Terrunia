import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { ExpeditionScreen } from './ExpeditionScreen'

const seedExpedition = (at = 'astravel_entry') => {
  const draft = createNewSave('ui-expedition', 'Orun', 'character.terririan.default', content, '2026-10-28T12:00:00Z')
  const bound = bindPrologueWeapon(draft, content, '2026-10-28T12:01:00Z', 'bound-expedition')
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.eventLog.push('CutsceneViewed:terran_arrival', 'CutsceneViewed:astravel_call')
  save.quests.vs_astravel_first_contact.status = 'active'
  save.world.currentLocationId = at
  save.world.unlockedLocationIds.push('astravel_entry')
  save.world.trailNodeStates.astravel_entry = 'completed'
  save.world.trailNodeStates.astravel_fungorro_01 = 'current'
  useGameStore.setState({ status: 'ready', ownerId: save.ownerId, syncStatus: 'saved', syncMode: 'local', save })
}

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('expedição pixelada de Astravél', () => {
  it('mantém a trilha e a mochila ao lado do mesmo mapa, sem liberar marcos bloqueados', () => {
    seedExpedition()
    render(<MemoryRouter initialEntries={['/expedition']}><ExpeditionScreen /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Astravél' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Astravél em pixels, vista superior 3\/4/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aproximar-se de Câmaras Fúngicas' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Trilha' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Rota de Astravél' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Mochila' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mochila' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Astravél em pixels/ })).toBeInTheDocument()
  })

  it('apenas inicia combate ao interagir com o nó disponível, preservando o save', () => {
    seedExpedition('astravel_fungorro_01')
    render(<MemoryRouter initialEntries={['/expedition']}>
      <Routes><Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/battle" element={<div>Combate ativo</div>} /></Routes>
    </MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Presença Fungorra' })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Enfrentar Fungorro' }))
    expect(screen.getByText('Combate ativo')).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle?.encounterId).toBe('encounter_fungorro_01')
  })
})
