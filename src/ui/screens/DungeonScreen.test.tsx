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
    fireEvent.click(screen.getByRole('button', { name: 'Mapa das Salas' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mapa das Salas' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir Mochila' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Mochila' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair das Câmaras para Astravél' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Dungeon em pixels, quatro salas/ })).toBeInTheDocument()
  })

  it('permite o primeiro estágio, sem assumir que descoberta libera o chefe', () => {
    seedDungeon()
    render(<MemoryRouter initialEntries={['/dungeon']}><Routes>
      <Route path="/dungeon" element={<DungeonScreen />} />
      <Route path="/battle" element={<div>Combate de estágio</div>} />
    </Routes></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Vestíbulo Micelial' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Vestíbulo Micelial' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enfrentar estágio 1/3' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Enfrentar estágio 1/3' }))
    expect(useGameStore.getState().save?.battle?.encounterId).toBe('encounter_fungal_vestibule_stage_1')
    expect(screen.getByText('Combate de estágio')).toBeInTheDocument()
  })

  it('descobrir todas as salas não libera a Sentinela sem as 12 ondas', () => {
    seedDungeon(true)
    render(<MemoryRouter initialEntries={['/dungeon']}><DungeonScreen /></MemoryRouter>)
    fireEvent.click(screen.getByRole('button', { name: 'Aproximar-se de Núcleo da Ruína' }))
    expect(screen.getByRole('complementary', { name: 'Painel lateral: Núcleo da Ruína' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Enfrentar Núcleo da Ruína/ })).not.toBeInTheDocument()
    expect(useGameStore.getState().save?.battle).toBeNull()
  })


  it('nova tentativa oculta visualmente salas históricas, sem apagar flags globais', () => {
    seedDungeon(true)
    const original = useGameStore.getState().save!
    const next = structuredClone(original)
    next.dungeonRun = {
      runId: 'attempt-new', dungeonId: 'dungeon_fungal_chambers',
      roomIndex: 0, stageIndex: 1, mode: 'stages',
      completedStageIds: [], clearedRoomIds: [], activeEncounterId: null,
      createdAt: '2026-11-09T10:00:00Z',
    }
    useGameStore.setState({ save: next })
    render(<MemoryRouter initialEntries={['/dungeon']}><DungeonScreen /></MemoryRouter>)
    expect(screen.getByRole('button', { name: 'Aproximar-se de Vestíbulo Micelial' })).toHaveClass('dungeon-field__node--discovered')
    expect(screen.getByRole('button', { name: 'Aproximar-se de Núcleo da Ruína' })).not.toHaveClass('dungeon-field__node--discovered')
    expect(useGameStore.getState().save?.world.worldFlags).toContain(dungeonRoomFlag('fungal_core'))
  })

})
