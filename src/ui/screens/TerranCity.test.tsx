import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { TerranLocationScreen } from './TerranLocationScreen'
import { TerranScreen } from './TerranScreen'

const createPlayableSave = () => {
  const save = createNewSave(
    'ui-terran-owner',
    'Lysa',
    'character.terririan.default',
    content,
    '2026-08-12T12:00:00.000Z',
    { saveId: 'ui-terran-save', characterId: 'ui-terran-character' },
  )
  const bound = bindPrologueWeapon(
    save,
    content,
    '2026-08-12T12:01:00.000Z',
    'ui-terran-bound',
  )
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}

const loadSave = (currentLocationId = 'terran') => {
  const save = createPlayableSave()
  save.world.currentLocationId = currentLocationId
  if (!save.world.unlockedLocationIds.includes(currentLocationId)) {
    save.world.unlockedLocationIds.push(currentLocationId)
  }
  useGameStore.setState({
    status: 'ready',
    syncStatus: 'saved',
    syncMode: 'local',
    ownerId: save.ownerId,
    save,
    error: null,
    notification: null,
  })
}

afterEach(() => {
  cleanup()
  useGameStore.getState().resetSession()
})

describe('interfaces de Terran', () => {
  it('renderiza Terran como Home com as sete áreas no minimapa', () => {
    loadSave()
    render(<MemoryRouter initialEntries={['/terran']}><TerranScreen /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: /^Terran$/ })).toBeInTheDocument()
    expect(screen.getByText('HOME · CIDADE-BASE DO JOGADOR')).toBeInTheDocument()
    for (const locationId of TERRAN_LOCATION_IDS) {
      expect(
        screen.getByRole('link', { name: new RegExp(`Ir para ${content.terranLocations[locationId].name}`) }),
      ).toBeInTheDocument()
    }
  })

  for (const locationId of TERRAN_LOCATION_IDS) {
    const location = content.terranLocations[locationId]
    it(`renderiza a interface de ${location.name}`, () => {
      loadSave(locationId)
      render(
        <MemoryRouter initialEntries={[`/terran/${locationId}`]}>
          <Routes>
            <Route path="/terran/:locationId" element={<TerranLocationScreen />} />
          </Routes>
        </MemoryRouter>,
      )

      expect(screen.getByRole('heading', { name: new RegExp(`^${location.name}$`) })).toBeInTheDocument()
      expect(screen.getByText(`TERRAN > ${location.name.toUpperCase()}`)).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Pessoas neste local' })).toBeInTheDocument()
    })
  }
})
