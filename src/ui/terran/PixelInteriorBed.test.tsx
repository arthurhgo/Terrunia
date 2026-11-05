import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { BASE_LOCATION_ID } from '../../domain/terran/base'
import { findInteriorPath } from './interiorLayout'
import { getRoomPlan } from './roomGeometry'
import { PLAYER_HOME_INTERIOR_ID } from './roomContent'
import { PixelInteriorCanvas } from './PixelInteriorCanvas'

beforeAll(() => vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null))
afterAll(() => vi.restoreAllMocks())
afterEach(cleanup)

const fresh = () => createNewSave('bed-test', 'Terrírian', 'character.terririan.default', content)

describe('interação física com a Cama da Base', () => {
  it('usa uma única área clicável e não descansa instantaneamente de longe', () => {
    const save = fresh()
    save.world.currentLocationId = BASE_LOCATION_ID
    const onServices = vi.fn()
    const onFurniture = vi.fn()
    const { container } = render(<PixelInteriorCanvas
      save={save} locationId={PLAYER_HOME_INTERIOR_ID} enabled
      onTalk={vi.fn()} onServices={onServices} onExit={vi.fn()} onFurniture={onFurniture}
    />)

    const bed = screen.getByRole('button', { name: 'Cama · descansar e recuperar' })
    expect(bed).toHaveTextContent('Cama')
    expect(bed.querySelector('small')).toHaveTextContent('descansar e recuperar')
    expect(screen.queryByRole('button', { name: 'Interagir com Cama da Base' })).not.toBeInTheDocument()
    expect(container.querySelectorAll('.pixel-interior__service')).toHaveLength(1)
    const plan = getRoomPlan(PLAYER_HOME_INTERIOR_ID)
    expect(findInteriorPath(plan.spawn, plan.service, PLAYER_HOME_INTERIOR_ID).length).toBeGreaterThan(0)

    // With no animation frame in the test, clicking only queues movement.
    fireEvent.click(bed)
    expect(onServices).not.toHaveBeenCalled()
    expect(onFurniture).not.toHaveBeenCalled()
  })

  it('sinaliza somente objetos de missão acionáveis, não missões concluídas', () => {
    const save = fresh()
    save.quests.main_terran_first_home.status = 'available'
    const props = { locationId: 'location_terran_daeryn_house' as const, enabled: true,
      onTalk: vi.fn(), onServices: vi.fn(), onExit: vi.fn(), onFurniture: vi.fn() }
    const { rerender } = render(<PixelInteriorCanvas save={save} {...props} />)
    const shelf = screen.getByRole('button', { name: 'Interagir com Estante de Cura' })
    expect(shelf).toHaveAttribute('data-interaction-glow', 'quest')
    const completed = structuredClone(save)
    completed.quests.main_terran_first_home.status = 'completed'
    rerender(<PixelInteriorCanvas save={completed} {...props} />)
    expect(shelf).not.toHaveAttribute('data-interaction-glow')
  })

  it('mantém os serviços existentes acessíveis nas outras instituições', () => {
    const save = fresh()
    save.world.currentLocationId = 'location_terran_daeryn_house'
    const onServices = vi.fn()
    render(<PixelInteriorCanvas
      save={save} locationId="location_terran_daeryn_house" enabled
      onTalk={vi.fn()} onServices={onServices} onExit={vi.fn()} onFurniture={vi.fn()}
    />)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir serviços do local' }))
    expect(onServices).toHaveBeenCalledTimes(1)
  })
})
