import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { PLAYER_HOME_DOOR } from './roomContent'
import { getCityDoor } from './cityWorld'
import { PixelCityCanvas } from './PixelCityCanvas'

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(cleanup)

const renderDoor = (spawnPoint: { x: number; y: number }, onEnter: (id: (typeof TERRAN_LOCATION_IDS)[number]) => void, onEnterHome: () => void, homeUnlocked = false) =>
  render(<PixelCityCanvas portraitAssetId="character.terririan.default" reducedMotion
    currentLocationId="location_terran_portal_plaza" enabled objectiveId={null}
    actors={[]} homeUnlocked={homeUnlocked} spawnPoint={spawnPoint}
    onEnterHome={onEnterHome} onEnter={onEnter} onTalk={() => {}}
    onInspectLandmark={() => {}} landmarkFlags={[]} />)

describe('Portas clicáveis das casas de Terran', () => {
  it('cria exatamente um botão de porta em cada uma das sete instituições', () => {
    const { container } = renderDoor(PLAYER_HOME_DOOR, vi.fn(), vi.fn())
    const doors = TERRAN_LOCATION_IDS.filter((id) => id !== 'location_terran_portal_plaza')
    expect(container.querySelectorAll('.pixel-city__door[data-city-door]')).toHaveLength(doors.length + 1)
    for (const id of doors) {
      expect(screen.getByRole('button', { name: `Abrir porta de ${content.terranLocations[id].name}` })).toBeEnabled()
    }
    expect(container.querySelector('.pixel-city__door[data-city-door="location_terran_portal_plaza"]')).toBeNull()
    expect(screen.getByRole('button', { name: 'Interagir com porta da Base do Terrírian' }))
      .toHaveClass('is-locked')
  })

  it('ao clicar em cada porta, aciona a entrada correspondente a partir de seu limiar', () => {
    for (const id of TERRAN_LOCATION_IDS.filter((value) => value !== 'location_terran_portal_plaza')) {
      const onEnter = vi.fn()
      renderDoor(getCityDoor(id), onEnter, vi.fn())
      fireEvent.click(screen.getByRole('button', { name: `Abrir porta de ${content.terranLocations[id].name}` }))
      expect(onEnter).toHaveBeenCalledExactlyOnceWith(id)
      cleanup()
    }
  })

  it('mantém a porta da Base interativa mesmo trancada, sem desbloquear por conta própria', () => {
    const onEnterHome = vi.fn()
    const { rerender } = renderDoor(PLAYER_HOME_DOOR, vi.fn(), onEnterHome)
    const door = screen.getByRole('button', { name: 'Interagir com porta da Base do Terrírian' })
    expect(door).toBeEnabled()
    expect(door).toHaveAttribute('title', 'Base do Terrírian · Porta trancada')
    fireEvent.click(door)
    expect(onEnterHome).toHaveBeenCalledTimes(1)
    // The callback is the only action; the domain must validate use of the key.
    expect(door).toHaveClass('is-locked')
    rerender(<PixelCityCanvas portraitAssetId="character.terririan.default" reducedMotion
      currentLocationId="location_terran_portal_plaza" enabled objectiveId={null}
      actors={[]} homeUnlocked spawnPoint={PLAYER_HOME_DOOR}
      onEnterHome={onEnterHome} onEnter={vi.fn()} onTalk={() => {}}
      onInspectLandmark={() => {}} landmarkFlags={[]} />)
    expect(screen.getByRole('button', { name: 'Interagir com porta da Base do Terrírian' }))
      .toHaveClass('is-open')
  })
})
