import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { dungeonRoomFlag } from '../../domain/exploration/dungeonEngine'
import { useGameStore } from '../../state/gameStore'
import { DungeonScreen } from './DungeonScreen'

function seedDungeon(allRooms = false) {
  const draft = createNewSave('dungeon-ui', 'Lysa', 'character.terririan.default', content, '2026-10-28T21:00:00Z')
  const bound = bindPrologueWeapon(draft, content, '2026-10-28T21:01:00Z', 'dungeon-bound')
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.eventLog.push('CutsceneViewed:fungal_descent')
  save.quests.main_astravel_corruption.status = 'active'
  save.world.currentLocationId = 'dungeon_fungal_chambers'
  save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
  save.world.worldFlags.push('dungeon_fungal_entered', dungeonRoomFlag('fungal_vestibule'))
  if (allRooms) save.world.worldFlags.push(...content.dungeons.dungeon_fungal_chambers.rooms.slice(1).map((room) => dungeonRoomFlag(room.id)))
  useGameStore.setState({ status: 'ready', ownerId: save.ownerId, syncMode: 'local', syncStatus: 'saved', save })
}

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('Câmaras Fúngicas em quatro salas', () => {
  it('mantém o cenário visível ao abrir mapa e mochila e preserva o acesso de retorno', () => {
    seedDungeon()
    render(<MemoryRouter initialEntries={['/dungeon']}><DungeonScreen /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Câmaras Fúngicas' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Dungeon em pixels, quatro salas/ })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Salas' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mapa das Salas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Mochila' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mochila' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair das Câmaras para Astravél' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Dungeon em pixels, quatro salas/ })).toBeInTheDocument()
  })

  it('encontro com Colosso exige acesso físico ao núcleo e clique explícito', () => {
    seedDungeon(true)
    render(<MemoryRouter initialEntries={['/dungeon']}><Routes>
      <Route path="/dungeon" element={<DungeonScreen />} /><Route path="/battle" element={<div>Combate do Colosso</div>} />
    </Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Núcleo da Ruína' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Núcleo da Ruína' })).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Enfrentar Colosso Micélio' }))
    expect(screen.getByText('Combate do Colosso')).toBeInTheDocument()
    expect(useGameStore.getState().save?.battle?.encounterId).toBe('encounter_colossus_mycelium_01')
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('dungeon_fungal_chambers')
  })
})
