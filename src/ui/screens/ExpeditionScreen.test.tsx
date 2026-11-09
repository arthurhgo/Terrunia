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
  save.quests.main_astravel_corruption.status = 'active'
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
    expect(screen.getByRole('button', { name: 'Aproximar-se de Clareira Luminescente' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' })).not.toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Trilha / 0 Entrada' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Minimapa de Astravél/)).not.toBeInTheDocument()
    const stage = screen.getByRole('region', { name: 'Cena contínua de Astravél' })
    const gameLayout = stage.parentElement
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Mochila' }))
    expect(gameLayout).toContainElement(screen.getByRole('complementary', { name: 'Painel lateral: Mochila' }))
    fireEvent.click(screen.getByRole('button', { name: 'Fechar janela da instância' }))
    expect(screen.queryByRole('complementary', { name: 'Painel lateral: Mochila' })).not.toBeInTheDocument()
    expect(stage).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Astravél em pixels/ })).toBeInTheDocument()
  })

  it('o Acampamento Abandonado precisa ser recuperado em combate antes de fornecer suprimentos', () => {
    seedExpedition('astravel_camp_03')
    const save = useGameStore.getState().save!
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.trailNodeStates.astravel_camp_03 = 'current'
    render(<MemoryRouter initialEntries={['/expedition']}><Routes>
      <Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/battle" element={<div>Combate do acampamento</div>} />
    </Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Acampamento Abandonado' }))
    expect(useGameStore.getState().save?.battle).toBeNull()
    const details = screen.getByRole('complementary', { name: 'Painel lateral: Acampamento Abandonado' })
    const fight = details.querySelector('.expedition-node-detail__action') as HTMLButtonElement
    expect(fight).toBeInTheDocument()
    fireEvent.click(fight)
    expect(screen.getByText('Combate do acampamento')).toBeVisible()
    expect(useGameStore.getState().save?.battle?.encounterId).toBe('encounter_astravel_camp_03')
    expect(useGameStore.getState().save?.inventory).toHaveLength(0)
  })

  it('ao chegar à Presença Fungorra permite voltar antes de enfrentar', () => {
    seedExpedition('astravel_fungorro_01')
    render(<MemoryRouter initialEntries={['/expedition']}>
      <Routes><Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/battle" element={<div>Combate ativo</div>} /></Routes>
    </MemoryRouter>)
    expect(useGameStore.getState().save?.battle).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(useGameStore.getState().save?.battle).toBeNull()
    const detail = screen.getByRole('complementary', { name: 'Painel lateral: Presença Fungorra' })
    const fight = detail.querySelector('.expedition-node-detail__action') as HTMLButtonElement
    expect(fight).toBeInTheDocument()
    fireEvent.click(fight)
    expect(screen.getByText('Combate ativo')).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle?.encounterId).toBe('encounter_fungorro_01')
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_fungorro_01')
  })

  it('não dispara encontros em marcos já concluídos ou bloqueados', () => {
    seedExpedition('astravel_fungorro_01')
    const save = useGameStore.getState().save!
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.trailNodeStates.astravel_camp_03 = 'current'
    render(<MemoryRouter initialEntries={['/expedition']}>
      <Routes><Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/battle" element={<div>Combate ativo</div>} /></Routes>
    </MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Presença Fungorra' }))
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Presença Fungorra' })).toBeInTheDocument()
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_spore_ambush_04).toBe('locked')
  })

  it('o marco final abre a dungeon, não dispara o chefe na floresta', () => {
    seedExpedition('astravel_boss_preview')
    const save = useGameStore.getState().save!
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.character.clan.clanId = 'dunavar'
    save.eventLog.push('CutsceneViewed:clan_oath')
    save.world.trailNodeStates.astravel_ruin_threshold_05 = 'completed'
    save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
    render(<MemoryRouter initialEntries={['/expedition']}><Routes>
      <Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/dungeon" element={<div>Interior das Câmaras</div>} />
    </Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Câmaras Fúngicas' }))
    expect(screen.getByRole('button', { name: 'Adentrar Câmaras Fúngicas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Adentrar Câmaras Fúngicas' }))
    expect(screen.getByText('Interior das Câmaras')).toBeInTheDocument()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('dungeon_fungal_chambers')
    expect(useGameStore.getState().save?.battle).toBeNull()
  })
  it('o Portal pode reiniciar em Entrada e ainda assim a etapa 15/15 abre as Câmaras', () => {
    seedExpedition('astravel_boss_preview')
    const save = useGameStore.getState().save!
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.character.clan.clanId = 'dunavar'
    save.eventLog.push('CutsceneViewed:clan_oath')
    save.world.trailNodeStates.astravel_ruin_threshold_05 = 'completed'
    save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
    render(<MemoryRouter initialEntries={['/expedition']}><Routes>
      <Route path="/expedition" element={<ExpeditionScreen />} /><Route path="/dungeon" element={<div>Câmaras desbloqueadas</div>} />
    </Routes></MemoryRouter>)
    // Open the physical final-stage drawer, then simulate the Portal's saved location.
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Câmaras Fúngicas' }))
    const reentered = structuredClone(useGameStore.getState().save!)
    reentered.world.currentLocationId = 'astravel_entry'
    useGameStore.setState({ save: reentered })
    expect(screen.getByRole('button', { name: 'Adentrar Câmaras Fúngicas' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Adentrar Câmaras Fúngicas' }))
    expect(screen.getByText('Câmaras desbloqueadas')).toBeInTheDocument()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('dungeon_fungal_chambers')
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_boss_preview).toBe('bossCurrent')
  })

})
